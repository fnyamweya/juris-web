import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionPayload } from "@repo/auth";
import { NextRequest } from "next/server";

// Stub locale/security packages so we don't pull in next-intl's complex
// pnpm dependency graph into the jsdom test environment
vi.mock("@repo/i18n", () => ({
  defaultLocale: "en",
  isLocale: (v: string) => ["en", "sw", "fr"].includes(v),
  locales: ["en", "sw", "fr"],
}));

vi.mock("@repo/security", () => ({
  createNonce: () => "test-nonce",
  CSP_NONCE_HEADER: "x-juris-csp-nonce",
  getSecurityHeaders: () => ({
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  }),
}));

// ─── Test data ────────────────────────────────────────────────────────────────

const SECRET = "test-secret-for-middleware-auth-tests";
const NOW = Math.floor(Date.now() / 1000);
const BFF_INTROSPECT_URL = "http://localhost:8080/v1/ui/sessions/introspect";

function fakeJwt(payload: Record<string, unknown>): string {
  const enc = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `${enc({ alg: "RS256" })}.${enc(payload)}.sig`;
}

const VALID_SESSION: SessionPayload = {
  at: fakeJwt({ sub: "u1", user_id: "u1", identity_type: "USER", platform_roles: [], tenant_memberships: [], exp: NOW + 3600 }),
  it: fakeJwt({ sub: "u1", name: "Test", email: "t@example.com" }),
  rt: "rt-valid",
  exp: NOW + 3600,
  tenants: [{ id: "t1", name: "Acme", slug: "acme" }],
};

const EXPIRED_SESSION: SessionPayload = {
  ...VALID_SESSION,
  exp: NOW - 60,
};

const REFRESHED_ACCESS_TOKEN = fakeJwt({
  sub: "u1",
  user_id: "u1",
  identity_type: "USER",
  platform_roles: [],
  tenant_memberships: [],
  exp: NOW + 7200,
});

const REFRESHED_SESSION: SessionPayload = {
  ...VALID_SESSION,
  at: REFRESHED_ACCESS_TOKEN,
  rt: "rt-new",
  exp: NOW + 7200,
};

// ─── Platform mock ────────────────────────────────────────────────────────────

vi.mock("@repo/platform", () => ({
  getEnv: vi.fn((key: string): string | undefined => {
    if (key === "SESSION_SECRET") return SECRET;
    if (key === "NEXT_PUBLIC_APP_ENV") return "local";
    if (key === "CAS_ISSUER_URL") return "http://localhost:9000";
    if (key === "CAS_BFF_CLIENT_ID") return "client-id";
    if (key === "CAS_BFF_CLIENT_SECRET") return "client-secret";
    if (key === "NODE_ENV") return "test";
    return undefined;
  }),
  requireEnv: vi.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(path: string, sessionCookie?: string): NextRequest {
  const req = new NextRequest(`http://localhost:3000${path}`);
  if (sessionCookie) {
    req.cookies.set("juris-session", sessionCookie);
  }
  return req;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function bffSessionResponse(
  status: "ACTIVE" | "LOCKED" | "EXPIRED" | "REVOKED" | "INVALID",
  payload: SessionPayload | null,
) {
  return jsonResponse({
    data: {
      status,
      payload,
      metadata:
        status === "INVALID"
          ? null
          : {
              subject: "u1",
              userId: "u1",
              email: "t@example.com",
              activeTenantId: payload?.activeTenantId,
            },
    },
  });
}

function mockBffSession(payload = VALID_SESSION) {
  vi.mocked(fetch).mockResolvedValueOnce(
    bffSessionResponse("ACTIVE", payload),
  );
}

function mockRefreshSuccess() {
  vi.mocked(fetch)
    .mockResolvedValueOnce(bffSessionResponse("ACTIVE", EXPIRED_SESSION))
    .mockResolvedValueOnce(
      jsonResponse({
        access_token: REFRESHED_ACCESS_TOKEN,
        id_token: VALID_SESSION.it,
        refresh_token: "rt-new",
        token_type: "Bearer",
        expires_in: 7200,
        scope: "openid",
      }),
    )
    .mockResolvedValueOnce(bffSessionResponse("ACTIVE", REFRESHED_SESSION));
}

function mockRefreshFailure() {
  vi.mocked(fetch)
    .mockResolvedValueOnce(bffSessionResponse("ACTIVE", EXPIRED_SESSION))
    .mockResolvedValueOnce(jsonResponse({ error: "invalid_grant" }, 400))
    .mockResolvedValueOnce(
      bffSessionResponse("ACTIVE", EXPIRED_SESSION),
    );
}

function fetchInputUrl(input: string | URL | Request) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function fetchUrls() {
  return vi.mocked(fetch).mock.calls.map(([input]) => fetchInputUrl(input));
}

function findFetchCall(pattern: string) {
  return vi.mocked(fetch).mock.calls.find(([input]) =>
    fetchInputUrl(input).includes(pattern),
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("console middleware auth guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default fetch stub — individual tests override this as needed
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      bffSessionResponse("INVALID", null),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects to login with returnTo when no session cookie is present", async () => {
    const { middleware } = await import("./middleware");
    const req = makeRequest("/en/console/overview");
    const response = await middleware(req);
    expect(response.status).toBe(307);
    const location = response.headers.get("Location") ?? "";
    expect(location).toContain("/en/login");
    expect(location).toContain("returnTo=");
    expect(location).toContain(encodeURIComponent("/en/console/overview"));
  });

  it("passes through when a valid unexpired session exists", async () => {
    mockBffSession();
    const { middleware } = await import("./middleware");
    const req = makeRequest("/en/console/overview", "opaque-session-handle");
    const response = await middleware(req);
    expect(response.status).toBe(200);
  });

  it("passes through and does NOT call CAS when token is not near expiry", async () => {
    mockBffSession();
    const { middleware } = await import("./middleware");
    const req = makeRequest("/en/console/overview", "opaque-session-handle");
    await middleware(req);
    expect(fetchUrls()).toContain(BFF_INTROSPECT_URL);
    expect(fetchUrls().some((url) => url.includes("/oauth2/token"))).toBe(false);
  });

  it("redirects to login with cleared cookie when session cookie is tampered", async () => {
    const { middleware } = await import("./middleware");
    const req = makeRequest("/en/console", "totally-garbage-value");
    const response = await middleware(req);
    expect(response.status).toBe(307);
    const setCookie = response.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toContain("juris-session=;");
  });

  it("redirects opaque locked sessions to the lock screen", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            status: "LOCKED",
            payload: null,
            metadata: { subject: "u1", userId: "u1" },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const { middleware } = await import("./middleware");
    const req = makeRequest("/en/console/overview", "opaque-session-handle");
    const response = await middleware(req);

    expect(response.status).toBe(307);
    const location = response.headers.get("Location") ?? "";
    expect(location).toContain("/en/session/locked");
    expect(location).toContain("returnTo=");
  });

  it("refreshes token transparently when access token is expired and refresh succeeds", async () => {
    mockRefreshSuccess();
    const { middleware } = await import("./middleware");
    const req = makeRequest("/en/console", "opaque-session-handle");
    const response = await middleware(req);

    expect(response.status).toBe(200);

    // New session cookie should be set
    const setCookie = response.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toContain("juris-session=");
    expect(setCookie).not.toContain("juris-session=;");

    // CAS token endpoint was called
    const tokenCall = findFetchCall("/oauth2/token");
    expect(tokenCall?.[0]).toContain("/oauth2/token");
    const body = new URLSearchParams(tokenCall?.[1]?.body as string);
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe(EXPIRED_SESSION.rt);
  });

  it("redirects to login and clears cookie when token is expired and refresh fails", async () => {
    mockRefreshFailure();
    const { middleware } = await import("./middleware");
    const req = makeRequest("/en/console", "opaque-session-handle");
    const response = await middleware(req);

    expect(response.status).toBe(307);
    const location = response.headers.get("Location") ?? "";
    expect(location).toContain("/en/login");
    const setCookie = response.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toContain("juris-session=;");
  });

  it("passes through health check paths without auth checks", async () => {
    const { middleware } = await import("./middleware");
    const req = makeRequest("/api/health/live");
    const response = await middleware(req);
    expect(response.status).toBe(200);
    expect(vi.mocked(fetch).mock.calls.length).toBe(0);
  });

  it("redirects non-locale paths to add the default locale prefix", async () => {
    const { middleware } = await import("./middleware");
    const req = makeRequest("/console/overview");
    const response = await middleware(req);
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toContain("/en/console/overview");
  });

  it("includes security headers on every response", async () => {
    mockBffSession();
    const { middleware } = await import("./middleware");
    const req = makeRequest("/en/console", "opaque-session-handle");
    const response = await middleware(req);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
  });

  it("includes security headers on redirect responses too", async () => {
    const { middleware } = await import("./middleware");
    const req = makeRequest("/en/console");
    const response = await middleware(req);
    expect(response.status).toBe(307);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});
