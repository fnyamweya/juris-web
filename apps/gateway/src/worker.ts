import packageMetadata from "../package.json";
import { resolveRoute, type GatewayRoute } from "./route-map";

type ServiceBinding = {
  fetch(request: Request): Promise<Response>;
};

type GatewayEnv = Partial<Record<GatewayRoute["binding"], ServiceBinding>> & {
  BUILD_TIME?: string;
  GIT_SHA?: string;
  PLATFORM_VERSION?: string;
};

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
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
      return json({
        status: "healthy",
        service: "juris-gateway",
        version: getPlatformVersion(env),
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/health/version") {
      return json({
        name: "gateway",
        version: getPlatformVersion(env),
        gitSha: env.GIT_SHA ?? "local",
        buildTime: env.BUILD_TIME ?? new Date().toISOString(),
        runtime: "cloudflare-workers",
      });
    }

    const route = resolveRoute(url.pathname);

    if (!route) {
      return json(
        {
          success: false,
          error: { code: "route_not_found", message: "Route not found" },
        },
        { status: 404 },
      );
    }

    const service = env[route.binding];

    if (service) {
      return service.fetch(request);
    }

    return json(
      {
        success: false,
        error: {
          code: "binding_missing",
          message: "No service binding is configured for " + route.name,
        },
      },
      { status: 503 },
    );
  },
};
