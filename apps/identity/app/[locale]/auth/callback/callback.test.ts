import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { encodePkceState, encodeSessionCookie, SESSION_COOKIE_NAME, PKCE_COOKIE_NAME } from "@repo/auth";
import type { PkcePayload, SessionPayload } from "@repo/auth";
import { NextRequest } from "next/server";

// ─── Shared test data ────────────────────────────────────────────────────────

const SECRET = "test-session-secret-for-callback-tests";

function base64UrlEncode(obj: unknown): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function fakeJwt(payload: Record<string, unknown>): string {
  const now = Math.floor(Date.now() / 1000);
  return [
    base64UrlEncode({ alg: "RS256" }),
    base64UrlEncode({ exp: now + 3600, iat: now, ...payload }),
    "fake-sig",
  ].join(".");
}

const VALID_ACCESS_TOKEN = fakeJwt({
  sub: "civis-auth|u1",
  user_id: "u1",
  identity_type: "USER",
  platform_roles: [],
  tenant_memberships: [
    { tenant_id: "t1", roles: ["TENANT_OWNER"], status: "ACTIVE", mfa_required: false, password_policy: "STANDARD" },
  ],
});

const VALID_ID_TOKEN = fakeJwt({
  sub: "civis-auth|u1",
  name: "Test User",
  email: "test@example.com",
});

const VALID_PKCE: PkcePayload = {
  state: "valid-state-abc",
  nonce: "nonce-xyz",
  codeVerifier: "code-verifier-value",
  locale: "en",
  returnTo: "/en/console",
};

// ─── Cookie store mock ───────────────────────────────────────────────────────

type CookieValue = { value: string } | undefined;

const cookieStore = {
  values: new Map<string, string>(),
  get(name: string): CookieValue {
    const v = this.values.get(name);
    return v !== undefined ? { value: v } : undefined;
  },
  set(name: string, value: string): void {
    this.values.set(name, value);
  },
  delete(name: string): void {
    this.values.delete(name);
  },
  clear(): void {
    this.values.clear();
  },
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

const redirectMock = vi.fn<[string], never>(() => {
  throw new Error("NEXT_REDIRECT");
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@repo/platform", () => ({
  requireEnv: vi.fn((key: string): string => {
    const envs: Record<string, string> = {
      SESSION_SECRET: SECRET,
      CAS_ISSUER_URL: "http://localhost:9000",
      CAS_BFF_CLIENT_ID: "client-id",
      CAS_BFF_CLIENT_SECRET: "client-secret",
      JURIS_BASE_URL: "http://localhost:3000",
    };
    if (envs[key]) return envs[key]!;
    throw new Error(`requireEnv: missing ${key}`);
  }),
  getEnv: vi.fn((key: string): string | undefined => {
    if (key === "NEXT_PUBLIC_APP_ENV") return "local";
    if (key === "CIVIS_CORE_URL") return "http://localhost:8080";
    return undefined;
  }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildRequest(
  code: string | null,
  state: string | null,
  error?: string,
): NextRequest {
  const url = new URL("http://localhost:3000/en/auth/callback");
  if (code) url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);
  if (error) url.searchParams.set("error", error);
  return new NextRequest(url);
}

async function setPkceCookie(pkce: PkcePayload = VALID_PKCE) {
  const encoded = await encodePkceState(pkce, SECRET);
  cookieStore.set(PKCE_COOKIE_NAME, encoded);
}

function mockTokenExchangeSuccess() {
  const now = Math.floor(Date.now() / 1000);
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        access_token: VALID_ACCESS_TOKEN,
        id_token: VALID_ID_TOKEN,
        refresh_token: "rt-opaque",
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid profile email",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
}

function mockTokenExchangeFailure(error = "invalid_grant") {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({ error, error_description: "Token exchange failed" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    ),
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("GET /[locale]/auth/callback", () => {
  beforeEach(() => {
    cookieStore.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects to login with error when CAS returns an error param", async () => {
    const { GET } = await import("./route");
    const request = buildRequest(null, null, "access_denied");
    await expect(
      GET(request, { params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith(
      expect.stringContaining("/en/login?error="),
    );
  });

  it("returns 400 when code is missing", async () => {
    const { GET } = await import("./route");
    const request = buildRequest(null, "some-state");
    const response = await GET(request, {
      params: Promise.resolve({ locale: "en" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 when state is missing", async () => {
    const { GET } = await import("./route");
    const request = buildRequest("some-code", null);
    const response = await GET(request, {
      params: Promise.resolve({ locale: "en" }),
    });
    expect(response.status).toBe(400);
  });

  it("redirects to login when PKCE cookie is absent", async () => {
    const { GET } = await import("./route");
    const request = buildRequest("code-123", "state-abc");
    await expect(
      GET(request, { params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/en/login?error=session_expired");
  });

  it("redirects to login and clears PKCE cookie on state mismatch", async () => {
    await setPkceCookie({ ...VALID_PKCE, state: "correct-state" });
    const { GET } = await import("./route");
    const request = buildRequest("code-123", "wrong-state");
    await expect(
      GET(request, { params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/en/login?error=state_mismatch");
    expect(cookieStore.get(PKCE_COOKIE_NAME)).toBeUndefined();
  });

  it("redirects to login when token exchange fails", async () => {
    await setPkceCookie();
    mockTokenExchangeFailure("invalid_grant");
    const { GET } = await import("./route");
    const request = buildRequest("bad-code", VALID_PKCE.state);
    await expect(
      GET(request, { params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith(
      expect.stringContaining("/en/login?error="),
    );
    // PKCE cookie must be cleared even on failure
    expect(cookieStore.get(PKCE_COOKIE_NAME)).toBeUndefined();
  });

  it("on success: clears PKCE cookie, sets session cookie, redirects to returnTo", async () => {
    await setPkceCookie();
    mockTokenExchangeSuccess();
    const { GET } = await import("./route");
    const request = buildRequest("valid-code", VALID_PKCE.state);
    await expect(
      GET(request, { params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");

    // PKCE cookie cleared
    expect(cookieStore.get(PKCE_COOKIE_NAME)).toBeUndefined();

    // Session cookie written
    const sessionRaw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    expect(sessionRaw).toBeTruthy();

    // Session cookie decodes to valid payload
    const { decodeSessionCookie } = await import("@repo/auth");
    const payload = await decodeSessionCookie(sessionRaw!, SECRET);
    expect(payload).not.toBeNull();
    expect(payload!.rt).toBe("rt-opaque");

    // Redirected to returnTo from PKCE payload
    expect(redirectMock).toHaveBeenCalledWith(VALID_PKCE.returnTo);
  });

  it("redirects to /{locale}/console when returnTo is absent in PKCE state", async () => {
    const pkceWithoutReturnTo: PkcePayload = { ...VALID_PKCE, returnTo: undefined };
    await setPkceCookie(pkceWithoutReturnTo);
    mockTokenExchangeSuccess();
    const { GET } = await import("./route");
    const request = buildRequest("code", VALID_PKCE.state);
    await expect(
      GET(request, { params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/en/console");
  });

  it("token exchange POST is called with correct parameters", async () => {
    await setPkceCookie();
    mockTokenExchangeSuccess();
    const { GET } = await import("./route");
    const request = buildRequest("auth-code-xyz", VALID_PKCE.state);
    await expect(
      GET(request, { params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall?.[0]).toContain("/oauth2/token");
    const body = new URLSearchParams(fetchCall?.[1]?.body as string);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("auth-code-xyz");
    expect(body.get("code_verifier")).toBe(VALID_PKCE.codeVerifier);
    expect(body.get("redirect_uri")).toBe("http://localhost:3000/en/auth/callback");
  });
});
