// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "@repo/auth";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { NextRequest } from "next/server";
import {
  APP_FLOW_COOKIE_NAME,
  CIVIS_BFF_NONCE,
  CIVIS_BFF_STATE,
  CIVIS_BFF_VERIFIER,
} from "@/lib/bff-cookies";

const SECRET = "test-session-secret-for-oauth-callback-tests";
const STATE = "valid-state";
const VERIFIER = "valid-code-verifier";
const NONCE = "valid-nonce";
const ISSUER = "http://localhost:9000";
const CLIENT_ID = "client-id";
const KEY_ID = "test-signing-key";

const { privateKey, publicKey } = await generateKeyPair("RS256");
const JWKS_RESPONSE = {
  keys: [{ ...(await exportJWK(publicKey)), kid: KEY_ID, alg: "RS256", use: "sig" }],
};

async function signJwt(claims: Record<string, unknown>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ exp: now + 3600, iat: now, iss: ISSUER, ...claims })
    .setProtectedHeader({ alg: "RS256", kid: KEY_ID })
    .sign(privateKey);
}

const ACCESS_TOKEN_WITH_SINGLE_TENANT = await signJwt({
  sub: "civis-auth|u1",
  user_id: "u1",
  identity_type: "USER",
  platform_roles: [],
  aud: "civis-core",
  tenant_memberships: [
    {
      tenant_id: "t1",
      roles: ["TENANT_OWNER"],
      status: "ACTIVE",
      mfa_required: false,
      password_policy: "STANDARD",
    },
  ],
});

const ID_TOKEN = await signJwt({
  sub: "civis-auth|u1",
  name: "Test User",
  email: "test@example.com",
  aud: CLIENT_ID,
  nonce: NONCE,
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock("@repo/platform", () => ({
  requireEnv: vi.fn((key: string): string => {
    const envs: Record<string, string> = {
      SESSION_SECRET: SECRET,
      CAS_ISSUER_URL: ISSUER,
      CAS_BFF_CLIENT_ID: CLIENT_ID,
      CAS_BFF_CLIENT_SECRET: "client-secret",
      JURIS_BASE_URL: "http://localhost:3000",
    };
    const value = envs[key];
    if (value) return value;
    throw new Error(`requireEnv: missing ${key}`);
  }),
  getEnv: vi.fn((key: string): string | undefined => {
    if (key === "NEXT_PUBLIC_APP_ENV") return "local";
    if (key === "CIVIS_CORE_URL") return "http://localhost:8080";
    if (key === "SESSION_SECRET") return SECRET;
    return undefined;
  }),
}));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildRequest(): NextRequest {
  const url = new URL("http://localhost:3000/oauth/callback");
  url.searchParams.set("code", "auth-code");
  url.searchParams.set("state", STATE);
  const request = new NextRequest(url);
  request.cookies.set(CIVIS_BFF_STATE, STATE);
  request.cookies.set(CIVIS_BFF_VERIFIER, VERIFIER);
  request.cookies.set(CIVIS_BFF_NONCE, NONCE);
  request.cookies.set(
    APP_FLOW_COOKIE_NAME,
    JSON.stringify({ locale: "en", returnTo: "/en/console" }),
  );
  return request;
}

function mockSuccessfulFlow() {
  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      jsonResponse({
        access_token: ACCESS_TOKEN_WITH_SINGLE_TENANT,
        id_token: ID_TOKEN,
        refresh_token: "rt-opaque",
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid profile email",
      }),
    )
    .mockResolvedValueOnce(jsonResponse(JWKS_RESPONSE))
    .mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            tenantId: "t1",
            tenantName: "Acme",
            status: "ACTIVE",
            roles: ["TENANT_OWNER"],
          },
        ],
      }),
    )
    .mockResolvedValueOnce(
      jsonResponse({
        data: {
          handle: "opaque-session-handle",
          session: {
            status: "ACTIVE",
            payload: null,
            metadata: { subject: "civis-auth|u1", userId: "u1" },
          },
        },
      }),
    );
}

function fetchInputUrl(input: string | URL | Request) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function findFetchCall(pattern: string) {
  return vi.mocked(fetch).mock.calls.find(([input]) =>
    fetchInputUrl(input).includes(pattern),
  );
}

function setCookieHeaders(response: Response): string[] {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  return headers.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
}

function cookieValue(response: Response, name: string): string | undefined {
  const joined = setCookieHeaders(response).join("\n");
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return joined.match(new RegExp(`${escaped}=([^;\\n]*)`))?.[1];
}

describe("GET /oauth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("uses the sole tenant as activeTenantId when the access token has no tid claim", async () => {
    mockSuccessfulFlow();
    const { GET } = await import("./route");
    const response = await GET(buildRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/en/console",
    );
    expect(cookieValue(response, SESSION_COOKIE_NAME)).toBe(
      "opaque-session-handle",
    );

    const sessionCall = findFetchCall("/v1/ui/sessions");
    expect(sessionCall).toBeDefined();
    const body = JSON.parse(sessionCall?.[1]?.body as string) as {
      activeTenantId?: string;
    };
    expect(body.activeTenantId).toBe("t1");
  });

  it("redirects to login with state_mismatch when the id_token nonce does not match", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: ACCESS_TOKEN_WITH_SINGLE_TENANT,
          id_token: ID_TOKEN,
          refresh_token: "rt-opaque",
          token_type: "Bearer",
          expires_in: 3600,
          scope: "openid profile email",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(JWKS_RESPONSE));

    const { GET } = await import("./route");
    const request = buildRequest();
    request.cookies.set(CIVIS_BFF_NONCE, "a-different-nonce");
    const response = await GET(request);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain("error=state_mismatch");
  });
});
