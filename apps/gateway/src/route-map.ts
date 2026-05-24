export type GatewayRoute = {
  name: string;
  binding:
    | "PUBLIC"
    | "IDENTITY"
    | "CONSOLE"
    | "ADMIN"
    | "BILLING"
    | "REPORTING"
    | "SETTINGS"
    | "SUPPORT"
    | "DOCS";
  localOrigin: string;
  prefixes: string[];
};

export const routeMap: GatewayRoute[] = [
  {
    name: "identity",
    binding: "IDENTITY",
    localOrigin: "http://127.0.0.1:3002",
    prefixes: [
      "/en/login",
      "/sw/login",
      "/fr/login",
      "/en/logout",
      "/en/register",
      "/en/forgot-password",
      "/sw/logout",
      "/sw/register",
      "/sw/forgot-password",
      "/fr/logout",
      "/fr/register",
      "/fr/forgot-password",
    ],
  },
  {
    name: "console",
    binding: "CONSOLE",
    localOrigin: "http://127.0.0.1:3003",
    prefixes: ["/en/console", "/sw/console", "/fr/console"],
  },
  {
    name: "admin",
    binding: "ADMIN",
    localOrigin: "http://127.0.0.1:3004",
    prefixes: ["/en/admin", "/sw/admin", "/fr/admin"],
  },
  {
    name: "billing",
    binding: "BILLING",
    localOrigin: "http://127.0.0.1:3005",
    prefixes: ["/en/billing", "/sw/billing", "/fr/billing"],
  },
  {
    name: "reporting",
    binding: "REPORTING",
    localOrigin: "http://127.0.0.1:3006",
    prefixes: ["/en/reports", "/sw/reports", "/fr/reports"],
  },
  {
    name: "settings",
    binding: "SETTINGS",
    localOrigin: "http://127.0.0.1:3007",
    prefixes: ["/en/settings", "/sw/settings", "/fr/settings"],
  },
  {
    name: "support",
    binding: "SUPPORT",
    localOrigin: "http://127.0.0.1:3008",
    prefixes: ["/en/support", "/sw/support", "/fr/support"],
  },
  {
    name: "docs",
    binding: "DOCS",
    localOrigin: "http://127.0.0.1:3009",
    prefixes: ["/en/docs", "/sw/docs", "/fr/docs"],
  },
  {
    name: "public",
    binding: "PUBLIC",
    localOrigin: "http://127.0.0.1:3001",
    prefixes: ["/", "/en", "/sw", "/fr"],
  },
];

export function resolveRoute(pathname: string): GatewayRoute | undefined {
  const sortedRoutes = [...routeMap].sort(
    (left, right) => longestPrefix(right).length - longestPrefix(left).length,
  );
  return sortedRoutes.find((route) =>
    route.prefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
    ),
  );
}

function longestPrefix(route: GatewayRoute): string {
  return route.prefixes.reduce(
    (current, next) => (next.length > current.length ? next : current),
    "",
  );
}
