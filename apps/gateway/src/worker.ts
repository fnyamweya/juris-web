import { getSecurityHeaders, isTrustedOrigin } from "@repo/security";
import packageMetadata from "../package.json";
import { resolveRoute, type GatewayRoute } from "./route-map";

type ServiceBinding = {
  fetch(request: Request): Promise<Response>;
};

type RateLimiterBinding = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

type GatewayEnv = Partial<Record<GatewayRoute["binding"], ServiceBinding>> & {
  BUILD_TIME?: string;
  GIT_SHA?: string;
  PLATFORM_VERSION?: string;
  ENVIRONMENT?: string;
  AUTH_RATE_LIMITER?: RateLimiterBinding;
  GATEWAY_RATE_LIMITER?: RateLimiterBinding;
};

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const RATE_LIMIT_RETRY_AFTER_SECONDS = 60;

function getEnvironment(env: GatewayEnv): string {
  return env.ENVIRONMENT ?? "production";
}

function json(body: unknown, env: GatewayEnv, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...getSecurityHeaders({ environment: getEnvironment(env) }),
      ...(init?.headers ?? {}),
    },
  });
}

function getPlatformVersion(env: GatewayEnv): string {
  return env.PLATFORM_VERSION ?? packageMetadata.version;
}

export default {
  async fetch(request: Request, env: GatewayEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health/live") {
      return json(
        {
          status: "healthy",
          service: "juris-gateway",
          version: getPlatformVersion(env),
          timestamp: new Date().toISOString(),
        },
        env,
      );
    }

    if (url.pathname === "/api/health/version") {
      return json(
        {
          name: "gateway",
          version: getPlatformVersion(env),
          gitSha: env.GIT_SHA ?? "local",
          buildTime: env.BUILD_TIME ?? new Date().toISOString(),
          runtime: "cloudflare-workers",
        },
        env,
      );
    }

    // CSRF defense-in-depth: reject state-changing requests whose Origin
    // header (when present) isn't one of our known app origins. Each Next.js
    // app still performs its own CSRF checks; this just stops obviously
    // cross-site writes at the edge.
    if (STATE_CHANGING_METHODS.has(request.method)) {
      const origin = request.headers.get("origin");
      if (origin && !isTrustedOrigin(origin)) {
        return json(
          {
            success: false,
            error: {
              code: "origin_not_allowed",
              message: "Request origin is not allowed",
            },
          },
          env,
          { status: 403 },
        );
      }
    }

    const route = resolveRoute(url.pathname);

    if (!route) {
      return json(
        {
          success: false,
          error: { code: "route_not_found", message: "Route not found" },
        },
        env,
        { status: 404 },
      );
    }

    const limiter =
      route.binding === "IDENTITY"
        ? env.AUTH_RATE_LIMITER
        : env.GATEWAY_RATE_LIMITER;

    if (limiter) {
      const clientKey = request.headers.get("cf-connecting-ip") ?? "unknown";
      const { success } = await limiter.limit({ key: clientKey });

      if (!success) {
        return json(
          {
            success: false,
            error: { code: "rate_limited", message: "Too many requests" },
          },
          env,
          {
            status: 429,
            headers: {
              "retry-after": String(RATE_LIMIT_RETRY_AFTER_SECONDS),
            },
          },
        );
      }
    }

    const service = env[route.binding];

    if (!service) {
      console.error(
        `juris-gateway: no service binding configured for route "${route.name}" (binding=${route.binding})`,
      );

      const message =
        getEnvironment(env) === "production"
          ? "Service temporarily unavailable"
          : `No service binding is configured for ${route.name}`;

      return json(
        {
          success: false,
          error: { code: "binding_missing", message },
        },
        env,
        { status: 503 },
      );
    }

    try {
      return await service.fetch(request);
    } catch (error) {
      console.error(
        `juris-gateway: upstream error for route "${route.name}"`,
        error,
      );

      return json(
        {
          success: false,
          error: {
            code: "upstream_error",
            message: `The ${route.name} app failed to respond`,
          },
        },
        env,
        { status: 502 },
      );
    }
  },
};
