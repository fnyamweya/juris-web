import http from "node:http";
import { URL } from "node:url";
import { getEnv } from "@repo/platform";
import { getSecurityHeaders, isTrustedOrigin } from "@repo/security";
import packageMetadata from "../package.json";
import { resolveRoute } from "./route-map";

const port = getGatewayPort();
const clientRoutes = new Map<string, ReturnType<typeof resolveRoute>>();

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const RATE_LIMIT_WINDOW_MS = 60_000;
const AUTH_RATE_LIMIT = 20;
const GATEWAY_RATE_LIMIT = 300;
const RATE_LIMIT_RETRY_AFTER_SECONDS = 60;
const rateLimitBuckets = new Map<
  string,
  { count: number; windowStart: number }
>();

type ProxySocket = NodeJS.ReadWriteStream & {
  destroyed?: boolean;
  writable?: boolean;
  destroy(error?: Error): void;
  end(chunk?: string): void;
  write(chunk: string | Uint8Array): boolean;
};

function json(
  res: http.ServerResponse,
  statusCode: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
): void {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    ...getSecurityHeaders({ environment: "local" }),
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

function routeForRequest(
  pathname: string,
  referer?: string,
  fallbackRoute?: ReturnType<typeof resolveRoute>,
): ReturnType<typeof resolveRoute> {
  if (pathname.startsWith("/_next/") && referer) {
    try {
      return resolveRoute(new URL(referer).pathname) ?? resolveRoute("/");
    } catch {
      return fallbackRoute ?? resolveRoute("/");
    }
  }

  if (pathname.startsWith("/_next/") && fallbackRoute) {
    return fallbackRoute;
  }

  return resolveRoute(pathname) ?? resolveRoute("/");
}

function clientKey(socket: unknown) {
  if (socket && typeof socket === "object" && "remoteAddress" in socket) {
    const remoteAddress = (socket as { remoteAddress?: unknown }).remoteAddress;
    return typeof remoteAddress === "string" ? remoteAddress : "unknown";
  }

  return "unknown";
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function headerToString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value.join(", ") : (value ?? "");
}

function destroySocket(socket: ProxySocket) {
  if (!socket.destroyed) {
    socket.destroy();
  }
}

function getPlatformVersion(): string {
  return getEnv("PLATFORM_VERSION") ?? packageMetadata.version;
}

function getGatewayPort() {
  const configuredPort = getEnv("GATEWAY_PORT") ?? getEnv("PORT") ?? "3000";
  const parsedPort = Number(configuredPort);

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65_535) {
    throw new Error(
      `Invalid gateway port "${configuredPort}". Expected an integer between 1 and 65535.`,
    );
  }

  return parsedPort;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:" + port);

  if (url.pathname === "/api/health/live") {
    json(res, 200, {
      status: "healthy",
      service: "juris-gateway",
      version: getPlatformVersion(),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (url.pathname === "/api/health/version") {
    json(res, 200, {
      name: "gateway",
      version: getPlatformVersion(),
      gitSha: getEnv("GIT_SHA") ?? "local",
      buildTime: getEnv("BUILD_TIME") ?? new Date().toISOString(),
      runtime: "cloudflare-workers",
    });
    return;
  }

  // CSRF defense-in-depth: reject state-changing requests whose Origin header
  // (when present) isn't one of our known app origins. Each Next.js app still
  // performs its own CSRF checks; this just stops obviously cross-site writes
  // at the edge.
  if (req.method && STATE_CHANGING_METHODS.has(req.method)) {
    const origin = firstHeader(req.headers.origin);
    if (origin && !isTrustedOrigin(origin)) {
      json(res, 403, {
        success: false,
        error: {
          code: "origin_not_allowed",
          message: "Request origin is not allowed",
        },
      });
      return;
    }
  }

  const referer = firstHeader(req.headers.referer);
  const key = clientKey(req.socket);
  const route = routeForRequest(url.pathname, referer, clientRoutes.get(key));

  if (!route) {
    json(res, 404, {
      success: false,
      error: { code: "route_not_found", message: "Route not found" },
    });
    return;
  }

  const rateLimitKey = `${key}:${route.binding === "IDENTITY" ? "auth" : "default"}`;
  const rateLimit =
    route.binding === "IDENTITY" ? AUTH_RATE_LIMIT : GATEWAY_RATE_LIMIT;

  if (!checkRateLimit(rateLimitKey, rateLimit)) {
    json(
      res,
      429,
      {
        success: false,
        error: { code: "rate_limited", message: "Too many requests" },
      },
      { "retry-after": String(RATE_LIMIT_RETRY_AFTER_SECONDS) },
    );
    return;
  }

  if (!url.pathname.startsWith("/_next/")) {
    clientRoutes.set(key, route);
  }

  const upstream = new URL(req.url ?? "/", route.localOrigin);
  const proxyReq = http.request(
    upstream,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: upstream.host,
        // Preserve the public-facing host so Next.js server action CSRF checks
        // compare origin against the gateway host, not the upstream app host.
        "x-forwarded-host": req.headers.host ?? "",
        "x-forwarded-proto": "http",
        "x-juris-gateway": "local",
      },
    },
    (proxyRes) => {
      proxyRes.on("error", () => {
        if (!res.destroyed) {
          res.destroy();
        }
      });
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", (error) => {
    console.error(
      `juris-gateway: upstream error for route "${route.name}"`,
      error,
    );
    json(res, 502, {
      success: false,
      error: {
        code: "upstream_unavailable",
        message: "The " + route.name + " app is not reachable",
      },
    });
  });

  req.on("aborted", () => proxyReq.destroy());
  req.on("error", () => proxyReq.destroy());
  res.on("error", () => proxyReq.destroy());
  req.pipe(proxyReq);
});

function writeUpgradeResponse(
  socket: ProxySocket,
  statusCode: number,
  statusMessage: string,
  headers: http.IncomingHttpHeaders,
) {
  if (socket.destroyed || !socket.writable) {
    return;
  }

  socket.write(
    [
      `HTTP/1.1 ${statusCode} ${statusMessage}`,
      ...Object.entries(headers).map(
        ([key, value]) => `${key}: ${headerToString(value)}`,
      ),
      "",
      "",
    ].join("\r\n"),
  );
}

server.on("upgrade", (req, socket, head) => {
  socket.on("error", () => destroySocket(socket));
  const url = new URL(req.url ?? "/", "http://127.0.0.1:" + port);
  const referer = firstHeader(req.headers.referer);
  const route = routeForRequest(
    url.pathname,
    referer,
    clientRoutes.get(clientKey(socket)),
  );

  if (!route) {
    socket.destroy();
    return;
  }

  const upstream = new URL(req.url ?? "/", route.localOrigin);
  const headers = {
    ...req.headers,
    host: upstream.host,
    "x-forwarded-host": req.headers.host ?? "",
    "x-forwarded-proto": "http",
    "x-juris-gateway": "local",
  };
  const proxyReq = http.request(upstream, {
    method: req.method,
    headers,
  });

  proxyReq.on("socket", (proxySocket: ProxySocket) => {
    proxySocket.on("error", () => destroySocket(socket));
    proxySocket.on("close", () => destroySocket(socket));
    socket.on("close", () => destroySocket(proxySocket));
  });

  proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
    proxySocket.on("error", () => destroySocket(socket));
    writeUpgradeResponse(
      socket,
      proxyRes.statusCode ?? 101,
      proxyRes.statusMessage ?? "Switching Protocols",
      proxyRes.headers,
    );

    if (proxyHead.length > 0) {
      socket.write(proxyHead);
    }

    if (head.length > 0) {
      proxySocket.write(head);
    }

    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.on("response", (proxyRes) => {
    proxyRes.on("error", () => destroySocket(socket));
    writeUpgradeResponse(
      socket,
      proxyRes.statusCode ?? 502,
      proxyRes.statusMessage ?? "Bad Gateway",
      proxyRes.headers,
    );
    proxyRes.pipe(socket);
  });

  proxyReq.on("error", () => socket.destroy());
  proxyReq.end();
});

server.on("clientError", (_error, socket) => {
  if (socket.writable) {
    socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
    return;
  }

  socket.destroy();
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      [
        `Juris gateway could not start because port ${port} is already in use.`,
        "Stop the existing listener, or override the gateway port with `GATEWAY_PORT=<port>`.",
        "Run `pnpm dev:check` to see the full local port matrix.",
      ].join("\n"),
    );
    process.exit(1);
  }

  throw error;
});

server.listen(port, () => {
  console.info("Juris gateway listening on http://127.0.0.1:" + port);
});
