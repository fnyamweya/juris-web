export type SecurityEnvironment =
  | "local"
  | "development"
  | "preview"
  | "production"
  | (string & {});

export type SecurityHeadersOptions = {
  environment?: SecurityEnvironment;
  nonce?: string;
  appName?: string;
};

export const CSP_NONCE_HEADER = "x-juris-csp-nonce";

const baseTrustedOrigins = [
  "https://juris.example.com",
  "https://*.juris.example.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
  "http://localhost:3006",
  "http://localhost:3007",
  "http://localhost:3008",
] as const;

export function createNonce(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function getTrustedOrigins(): readonly string[] {
  return baseTrustedOrigins;
}

export function isTrustedOrigin(origin: string): boolean {
  return getTrustedOrigins().some((trustedOrigin) => {
    if (trustedOrigin.includes("*")) {
      const suffix = trustedOrigin.replace("https://*", "");
      return origin.endsWith(suffix);
    }

    return origin === trustedOrigin;
  });
}

export function getContentSecurityPolicy(
  options: SecurityHeadersOptions = {},
): string {
  const environment = options.environment ?? "production";
  const isLocal = environment === "local" || environment === "development";
  const nonceSource = options.nonce
    ? "'nonce-" + options.nonce + "'"
    : "'self'";
  const scriptSources = ["'self'", nonceSource];
  const connectSources = ["'self'", "https://*.juris.example.com"];
  const imageSources = ["'self'", "data:", "https:"];
  const styleSources = ["'self'", "'unsafe-inline'"];

  if (isLocal) {
    scriptSources.push("'unsafe-eval'");
    connectSources.push("http://localhost:*", "ws://localhost:*");
    imageSources.push("http://localhost:*");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "img-src " + imageSources.join(" "),
    "script-src " + scriptSources.join(" "),
    "style-src " + styleSources.join(" "),
    "font-src 'self' data:",
    "connect-src " + connectSources.join(" "),
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function getSecurityHeaders(
  options: SecurityHeadersOptions = {},
): Record<string, string> {
  const environment = options.environment ?? "production";
  const headers: Record<string, string> = {
    "Content-Security-Policy": getContentSecurityPolicy(options),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  if (environment === "production") {
    headers["Strict-Transport-Security"] =
      "max-age=63072000; includeSubDomains; preload";
  }

  return headers;
}

export function createCsrfPlaceholder(): {
  headerName: string;
  cookieName: string;
} {
  return {
    headerName: "x-juris-csrf",
    cookieName: "__Host-juris-csrf",
  };
}
