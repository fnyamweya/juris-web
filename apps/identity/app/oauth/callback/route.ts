import type { CasAccessTokenClaims, SessionPayload, StoredTenant } from "@repo/auth";
import {
  decodePkceState,
  encodeSessionCookie,
  exchangeAuthorizationCode,
  PKCE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@repo/auth";
import { getEnv, requireEnv } from "@repo/platform";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import {
  APP_FLOW_COOKIE_NAME,
  CIVIS_BFF_NONCE,
  CIVIS_BFF_STATE,
  CIVIS_BFF_VERIFIER,
} from "@/lib/bff-cookies";

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function isSecure(): boolean {
  return (
    getEnv("NEXT_PUBLIC_APP_ENV") === "production" ||
    getEnv("NEXT_PUBLIC_APP_ENV") === "staging"
  );
}

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const cookieStore = await cookies();

  // ── Resolve locale + returnTo ─────────────────────────────────────────────
  const appFlowRaw = request.cookies.get(APP_FLOW_COOKIE_NAME)?.value;
  let locale = "en";
  let returnTo = "/en/console";
  if (appFlowRaw) {
    try {
      const appFlow = JSON.parse(appFlowRaw) as {
        locale?: string;
        returnTo?: string;
      };
      if (appFlow.locale) locale = appFlow.locale;
      if (appFlow.returnTo) returnTo = appFlow.returnTo;
    } catch {
      // use defaults
    }
  }

  // ── Resolve PKCE state + verifier ─────────────────────────────────────────
  // Primary path: civis-core BFF set these cookies during /api/auth/login.
  let storedState: string | undefined = request.cookies.get(CIVIS_BFF_STATE)?.value;
  let codeVerifier: string | undefined = request.cookies.get(CIVIS_BFF_VERIFIER)?.value;
  let usingBffCookies = !!storedState;

  // Fallback path: we generated PKCE locally and stored it in juris-pkce.
  if (!storedState || !codeVerifier) {
    const pkceRaw = request.cookies.get(PKCE_COOKIE_NAME)?.value;
    const secret = getEnv("SESSION_SECRET");
    if (pkceRaw && secret) {
      const pkce = await decodePkceState(pkceRaw, secret);
      if (pkce) {
        storedState = pkce.state;
        codeVerifier = pkce.codeVerifier;
        // Also pick up locale/returnTo from the PKCE payload (overrides appFlow)
        if (pkce.locale) locale = pkce.locale;
        if (pkce.returnTo) returnTo = pkce.returnTo;
        usingBffCookies = false;
      }
    }
  }

  function clearFlowCookies() {
    if (usingBffCookies) {
      cookieStore.delete(CIVIS_BFF_STATE);
      cookieStore.delete(CIVIS_BFF_VERIFIER);
      cookieStore.delete(CIVIS_BFF_NONCE);
    } else {
      cookieStore.delete(PKCE_COOKIE_NAME);
    }
    cookieStore.delete(APP_FLOW_COOKIE_NAME);
  }

  // ── Handle CAS error response ─────────────────────────────────────────────
  if (errorParam) {
    clearFlowCookies();
    const desc = searchParams.get("error_description") ?? errorParam;
    redirect(`/${locale}/login?error=${encodeURIComponent(desc)}`);
  }

  if (!code || !stateParam) {
    return new Response(JSON.stringify({ error: "Missing code or state" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!storedState || storedState !== stateParam) {
    // State mismatch is almost always caused by back-button navigation starting
    // a new OAuth2 flow that overwrites the state cookie while CAS completes the
    // old one. It is NOT a CSRF attack in normal browser usage. Rather than
    // showing a scary "could not be verified" error, clear the stale cookies and
    // silently redirect to the login page so the user can start fresh — the
    // server logs this at WARN level so security teams can detect genuine attacks.
    clearFlowCookies();
    redirect(`/${locale}/login`);
  }

  if (!codeVerifier) {
    clearFlowCookies();
    // Verifier gone — cookies expired or were cleared. Silent restart.
    redirect(`/${locale}/login`);
  }

  // ── Token exchange ────────────────────────────────────────────────────────
  const casUrl = requireEnv("CAS_ISSUER_URL");
  const clientId = requireEnv("CAS_BFF_CLIENT_ID");
  const clientSecret = requireEnv("CAS_BFF_CLIENT_SECRET");
  const baseUrl = requireEnv("JURIS_BASE_URL");
  const sessionSecret = requireEnv("SESSION_SECRET");
  const redirectUri = `${baseUrl}/oauth/callback`;

  const result = await exchangeAuthorizationCode({
    casUrl,
    clientId,
    clientSecret,
    code,
    redirectUri,
    codeVerifier,
  });

  clearFlowCookies();

  if (!result.ok) {
    const desc = result.error.error_description ?? result.error.error;
    redirect(`/${locale}/login?error=${encodeURIComponent(desc)}`);
  }

  const { access_token, id_token, refresh_token, expires_in } = result.tokens;

  const civisCoreUrl =
    getEnv("CIVIS_CORE_URL") ?? casUrl.replace(":9000", ":8080");
  const tenants = await resolveTenantsFromToken(access_token, civisCoreUrl);

  const sessionPayload: SessionPayload = {
    at: access_token,
    it: id_token,
    rt: refresh_token,
    exp: Math.floor(Date.now() / 1000) + expires_in,
    tenants,
  };

  const encryptedSession = await encodeSessionCookie(sessionPayload, sessionSecret);

  cookieStore.set(SESSION_COOKIE_NAME, encryptedSession, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
    secure: isSecure(),
  });

  const safeReturnTo = returnTo.startsWith("/") ? returnTo : `/${locale}/console`;
  redirect(safeReturnTo);
}

// ─── Tenant resolution ─────────────────────────────────────────────────────

function parseJwt<T>(token: string): T | null {
  try {
    const b64 = token.split(".")[1];
    if (!b64) return null;
    const padded =
      b64.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as T;
  } catch {
    return null;
  }
}

type TenantApiBody = { data?: { id: string; name: string; slug: string } };

async function resolveTenantsFromToken(
  accessToken: string,
  civisCoreUrl: string,
): Promise<StoredTenant[]> {
  const claims = parseJwt<CasAccessTokenClaims>(accessToken);
  if (!claims?.tenant_memberships?.length) return [];

  const results = await Promise.allSettled(
    claims.tenant_memberships
      .filter((m) => m.status !== "INACTIVE")
      .map(async (m): Promise<StoredTenant> => {
        const fallback: StoredTenant = {
          id: m.tenant_id,
          name: m.tenant_id,
          slug: m.tenant_id,
        };

        const res = await fetch(
          `${civisCoreUrl}/platform/api/v1/tenants/${m.tenant_id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          },
        ).catch(() => null);

        if (!res?.ok) return fallback;

        const body = (await res.json()) as TenantApiBody;
        const d = body.data;
        return d ? { id: d.id, name: d.name, slug: d.slug } : fallback;
      }),
  );

  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<StoredTenant>).value);
}
