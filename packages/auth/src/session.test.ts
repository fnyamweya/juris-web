import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { encodeSessionCookie } from "./session-codec";
import type { SessionPayload } from "./types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function base64UrlEncode(obj: unknown): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Build a minimal unsigned JWT with given payload claims */
function fakeJwt(payload: Record<string, unknown>): string {
  const header = base64UrlEncode({ alg: "RS256", typ: "JWT" });
  const body = base64UrlEncode(payload);
  return `${header}.${body}.fake-signature`;
}

const NOW_SECONDS = Math.floor(Date.now() / 1000);

const ACCESS_TOKEN = fakeJwt({
  sub: "civis-auth|user-1",
  identity_type: "USER",
  user_id: "user-uuid-1",
  platform_roles: [],
  tenant_memberships: [
    { tenant_id: "t1", roles: ["TENANT_OWNER"], status: "ACTIVE", mfa_required: false, password_policy: "STANDARD" },
  ],
  iss: "http://localhost:9000",
  aud: "civis-core",
  exp: NOW_SECONDS + 3600,
  iat: NOW_SECONDS,
});

const PLATFORM_ADMIN_ACCESS_TOKEN = fakeJwt({
  sub: "civis-auth|admin-1",
  identity_type: "USER",
  user_id: "admin-uuid-1",
  platform_roles: ["PLATFORM_SUPER_ADMIN"],
  tenant_memberships: [],
  iss: "http://localhost:9000",
  aud: "civis-core",
  exp: NOW_SECONDS + 3600,
  iat: NOW_SECONDS,
});

const ID_TOKEN = fakeJwt({
  sub: "civis-auth|user-1",
  name: "Amara Okafor",
  email: "amara@example.com",
  picture: "https://example.com/avatar.jpg",
  iss: "http://localhost:9000",
  aud: "civis-core",
  exp: NOW_SECONDS + 3600,
  iat: NOW_SECONDS,
});

const TENANTS = [{ id: "t1", name: "Acme Corp", slug: "acme" }];

const SESSION_SECRET = "test-session-secret-32chars-padded";

async function buildCookie(overrides?: Partial<SessionPayload>): Promise<string> {
  const payload: SessionPayload = {
    at: ACCESS_TOKEN,
    it: ID_TOKEN,
    rt: "refresh-token",
    exp: NOW_SECONDS + 3600,
    tenants: TENANTS,
    ...overrides,
  };
  return encodeSessionCookie(payload, SESSION_SECRET);
}

// ─── Mock setup ─────────────────────────────────────────────────────────────

let mockCookieValue: string | undefined;

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn((name: string) =>
      name === "juris-session" && mockCookieValue
        ? { value: mockCookieValue }
        : undefined,
    ),
  })),
}));

vi.mock("@repo/platform", () => ({
  getEnv: vi.fn((key: string) => {
    if (key === "SESSION_SECRET") return SESSION_SECRET;
    if (key === "NEXT_PUBLIC_APP_ENV") return "staging"; // ensures mock bypass is inactive
    if (key === "USE_MOCK_SESSION") return undefined;
    return undefined;
  }),
  requireEnv: vi.fn((key: string) => {
    if (key === "SESSION_SECRET") return SESSION_SECRET;
    throw new Error(`requireEnv: missing ${key}`);
  }),
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("getSession()", () => {
  beforeEach(() => { mockCookieValue = undefined; });
  afterEach(() => { vi.clearAllMocks(); });

  it("returns anonymous session when no cookie is present", async () => {
    const { getSession } = await import("./session");
    const session = await getSession();
    expect(session.status).toBe("anonymous");
    expect(session.user).toBeUndefined();
    expect(session.permissions).toEqual([]);
  });

  it("returns authenticated session with correct user info from id_token", async () => {
    mockCookieValue = await buildCookie();
    const { getSession } = await import("./session");
    const session = await getSession();
    expect(session.status).toBe("authenticated");
    expect(session.user?.name).toBe("Amara Okafor");
    expect(session.user?.email).toBe("amara@example.com");
    expect(session.user?.avatarUrl).toBe("https://example.com/avatar.jpg");
    expect(session.user?.id).toBe("user-uuid-1");
  });

  it("maps TENANT_OWNER role to the expected permissions", async () => {
    mockCookieValue = await buildCookie();
    const { getSession } = await import("./session");
    const session = await getSession();
    expect(session.permissions).toContain("console:read");
    expect(session.permissions).toContain("billing:read");
    expect(session.permissions).toContain("billing:write");
    expect(session.permissions).toContain("settings:read");
    expect(session.permissions).toContain("settings:write");
    expect(session.permissions).toContain("support:read");
    expect(session.permissions).toContain("reporting:read");
    expect(session.permissions).not.toContain("admin:read");
  });

  it("maps PLATFORM_SUPER_ADMIN to all permissions", async () => {
    mockCookieValue = await buildCookie({
      at: PLATFORM_ADMIN_ACCESS_TOKEN,
      tenants: [],
    });
    const { getSession } = await import("./session");
    const session = await getSession();
    expect(session.permissions).toContain("admin:read");
    expect(session.permissions).toContain("admin:write");
    expect(session.permissions).toContain("billing:read");
    expect(session.permissions).toContain("console:read");
  });

  it("populates availableTenants from the session payload", async () => {
    mockCookieValue = await buildCookie();
    const { getSession } = await import("./session");
    const session = await getSession();
    expect(session.availableTenants).toHaveLength(1);
    expect(session.availableTenants[0]?.name).toBe("Acme Corp");
  });

  it("sets currentTenant to the first available tenant", async () => {
    mockCookieValue = await buildCookie();
    const { getSession } = await import("./session");
    const session = await getSession();
    expect(session.currentTenant?.id).toBe("t1");
  });

  it("returns anonymous session when access token is expired", async () => {
    mockCookieValue = await buildCookie({ exp: NOW_SECONDS - 1 });
    const { getSession } = await import("./session");
    const session = await getSession();
    expect(session.status).toBe("anonymous");
  });

  it("returns anonymous session when cookie is tampered", async () => {
    mockCookieValue = "totally-invalid-cookie-value";
    const { getSession } = await import("./session");
    const session = await getSession();
    expect(session.status).toBe("anonymous");
  });

  it("returns anonymous session when JWT payloads are invalid", async () => {
    mockCookieValue = await buildCookie({
      at: "not.a.jwt",
      it: "not.a.jwt",
    });
    const { getSession } = await import("./session");
    const session = await getSession();
    expect(session.status).toBe("anonymous");
  });

  it("expiresAt matches the access token exp", async () => {
    mockCookieValue = await buildCookie();
    const { getSession } = await import("./session");
    const session = await getSession();
    const exp = new Date(session.expiresAt!).getTime() / 1000;
    expect(exp).toBeCloseTo(NOW_SECONDS + 3600, -1);
  });
});

describe("getSession() mock bypass", () => {
  afterEach(() => { vi.clearAllMocks(); });

  it("returns mock session when USE_MOCK_SESSION=true", async () => {
    // Temporarily override the getEnv mock to return "true" for USE_MOCK_SESSION
    const platform = await import("@repo/platform");
    vi.mocked(platform.getEnv).mockImplementation((key) => {
      if (key === "USE_MOCK_SESSION") return "true";
      return undefined;
    });

    const { getSession, mockSession } = await import("./session");
    const session = await getSession();
    expect(session).toBe(mockSession);
  });
});
