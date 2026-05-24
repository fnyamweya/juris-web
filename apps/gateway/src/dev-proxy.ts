import http from "node:http";
import { URL } from "node:url";
import packageMetadata from "../package.json";
import { resolveRoute } from "./route-map";

const port = 3000;
const clientRoutes = new Map<string, ReturnType<typeof resolveRoute>>();

function json(
  res: http.ServerResponse,
  statusCode: number,
  body: unknown,
): void {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(body));
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

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:" + port);

  if (url.pathname === "/api/health/live") {
    json(res, 200, {
      status: "healthy",
      service: "juris-gateway",
      version: packageMetadata.version,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (url.pathname === "/api/health/version") {
    json(res, 200, {
      name: "gateway",
      version: packageMetadata.version,
      gitSha: "local",
      buildTime: new Date().toISOString(),
      runtime: "cloudflare-workers",
    });
    return;
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
        "x-juris-gateway": "local",
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", (error) => {
    json(res, 502, {
      success: false,
      error: {
        code: "upstream_unavailable",
        message: "The " + route.name + " app is not reachable",
        details: error.message,
      },
    });
  });

  req.pipe(proxyReq);
});

function writeUpgradeResponse(
  socket: NodeJS.WritableStream,
  statusCode: number,
  statusMessage: string,
  headers: http.IncomingHttpHeaders,
) {
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
    "x-juris-gateway": "local",
  };
  const proxyReq = http.request(upstream, {
    method: req.method,
    headers,
  });

  proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
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

server.listen(port, () => {
  console.info("Juris gateway listening on http://127.0.0.1:" + port);
});
