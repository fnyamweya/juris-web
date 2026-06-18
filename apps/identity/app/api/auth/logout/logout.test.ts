import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { encodeSessionCookie, SESSION_COOKIE_NAME } from "@repo/auth";
import type { SessionPayload } from "@repo/auth";
import { NextRequest } from "next/server";

// ─── Test data ───────────────────────────────────────────────────────────────

const SECRET = "test-secret-for-logout-tests-padded";
const NOW = Math.floor(Date.now() / 1000);

function fakeJwt(payload: Record<string, unknown>): string {
  const enc = (o: unknown) =>
    btoa(JSON.stringify(o))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  return `${enc({ alg: "RS256" })}.${enc({ ...payload, exp: NOW + 3600 })}.sig`;
}

function fetchUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

const VALID_SESSION: SessionPayload = {
  at: fakeJwt({
    sub: "u1",
    user_id: "u1",
    identity_type: "USER",
    platform_roles: [],
    tenant_memberships: [],
  }),
  it: fakeJwt({ sub: "u1", name: "Test", email: "test@example.com" }),
  exp: NOW + 3600,
  tenants: [],
};

// ─── Cookie mock ─────────────────────────────────────────────────────────────

const cookieStore = {
  values: new Map<string, string>(),
  get(name: string) {
    const v = this.values.get(name);
    return v !== undefined ? { value: v } : undefined;
  },
  delete(name: string) {
    this.values.delete(name);
  },
  clear() {
    this.values.clear();
  },
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

vi.mock("@repo/platform", () => ({
  getEnv: vi.fn((key: string): string | undefined => {
    if (key === "SESSION_SECRET") return SECRET;
    if (key === "CIVIS_CORE_URL") return "http://localhost:8080";
    return undefined;
  }),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("GET /api/auth/logout", () => {
  beforeEach(() => {
    cookieStore.clear();
    vi.clearAllMocks();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clears the session cookie and redirects to /{locale}/logout", async () => {
    const encoded = await encodeSessionCookie(VALID_SESSION, SECRET);
    cookieStore.values.set(SESSION_COOKIE_NAME, encoded);

    const { GET } = await import("./route");
    const req = new NextRequest(
      "http://localhost:3000/api/auth/logout?locale=en",
    );
    const response = await GET(req);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toContain("/en/logout");
    expect(cookieStore.get(SESSION_COOKIE_NAME)).toBeUndefined();
  });

  it("revokes the BFF session via /v1/ui/sessions/revoke", async () => {
    const encoded = await encodeSessionCookie(VALID_SESSION, SECRET);
    cookieStore.values.set(SESSION_COOKIE_NAME, encoded);

    const { GET } = await import("./route");
    const req = new NextRequest(
      "http://localhost:3000/api/auth/logout?locale=en",
    );
    await GET(req);

    const revokeCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => fetchUrl(url).includes("/v1/ui/sessions/revoke"));
    expect(revokeCall).toBeTruthy();
    const body = JSON.parse(revokeCall![1]?.body as string) as { handle: string };
    expect(body.handle).toBe(encoded);
    const headers = revokeCall![1]?.headers as Record<string, string>;
    expect(headers["X-Civis-Bff-Client-Id"]).toBeTruthy();
    expect(headers["X-Civis-Bff-Client-Secret"]).toBeTruthy();
  });

  it("still redirects and clears cookie when no session cookie exists", async () => {
    const { GET } = await import("./route");
    const req = new NextRequest(
      "http://localhost:3000/api/auth/logout?locale=sw",
    );
    const response = await GET(req);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toContain("/sw/logout");
    // No session revocation call since there was no session cookie
    const revokeCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([url]) => fetchUrl(url).includes("/v1/ui/sessions/revoke"));
    expect(revokeCalls).toHaveLength(0);
  });

  it("defaults to locale 'en' when locale param is missing", async () => {
    const { GET } = await import("./route");
    const req = new NextRequest("http://localhost:3000/api/auth/logout");
    const response = await GET(req);
    expect(response.headers.get("Location")).toContain("/en/logout");
  });

  it("still redirects when CAS revocation request fails (best-effort)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
    const encoded = await encodeSessionCookie(VALID_SESSION, SECRET);
    cookieStore.values.set(SESSION_COOKIE_NAME, encoded);

    const { GET } = await import("./route");
    const req = new NextRequest(
      "http://localhost:3000/api/auth/logout?locale=en",
    );
    const response = await GET(req);

    expect(response.status).toBe(302);
    expect(cookieStore.get(SESSION_COOKIE_NAME)).toBeUndefined();
  });
});
