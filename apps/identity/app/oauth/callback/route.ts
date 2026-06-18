import {
  type BffSessionResponse,
  createBffSession,
  decodePkceState,
  encodeTenantCtxCookie,
  exchangeAuthorizationCode,
  PKCE_COOKIE_NAME,
  reactivateBffSession,
  sanitizeReturnTo,
  SESSION_COOKIE_NAME,
  TENANT_CTX_COOKIE_MAX_AGE,
  TENANT_CTX_COOKIE_NAME,
  verifyAccessToken,
  verifyIdToken,
} from "@repo/auth";
import { getEnv, requireEnv } from "@repo/platform";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  APP_FLOW_COOKIE_NAME,
  CIVIS_BFF_NONCE,
  CIVIS_BFF_STATE,
  CIVIS_BFF_VERIFIER,
} from "@/lib/bff-cookies";
import {
  activeTenantIdFromToken,
  resolveTenantsFromToken,
} from "@/lib/tenant-resolution";

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function isSecure(): boolean {
  return (
    getEnv("NEXT_PUBLIC_APP_ENV") === "production" ||
    getEnv("NEXT_PUBLIC_APP_ENV") === "staging"
  );
}

// ─── Cookie builders ────────────────────────────────────────────────────────
// Build Set-Cookie header strings directly to avoid any interaction between
// the next/headers cookies() API and NextResponse — in Next.js 15 Route Handlers
// this combination is unreliable and can cause Set-Cookie headers to be dropped.

function setCookie(
  name: string,
  value: string,
  maxAge: number,
  secure: boolean,
): string {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function deleteCookie(name: string): string {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function loginRedirectResponse(
  locale: string,
  cookiesToDelete: string[],
  reason?: string,
): Response {
  const base = getEnv("JURIS_BASE_URL") ?? "http://localhost:3000";
  const dest = reason
    ? `/${locale}/login?error=${encodeURIComponent(reason)}`
    : `/${locale}/login`;
  const headers = new Headers({ Location: new URL(dest, base).toString() });
  for (const name of cookiesToDelete) {
    headers.append("Set-Cookie", deleteCookie(name));
  }
  return new Response(null, { status: 302, headers });
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
  let appFlow:
    | {
        locale?: string;
        returnTo?: string;
        flow?: "login" | "reactivate";
        sessionHandle?: string;
        reauthStartedAt?: string;
      }
    | undefined;
  if (appFlowRaw) {
    try {
      appFlow = JSON.parse(appFlowRaw) as {
        locale?: string;
        returnTo?: string;
        flow?: "login" | "reactivate";
        sessionHandle?: string;
        reauthStartedAt?: string;
      };
      if (appFlow.locale) locale = appFlow.locale;
      if (appFlow.returnTo) returnTo = appFlow.returnTo;
    } catch {
      // use defaults
    }
  }

  // Always delete every possible flow cookie so stale state never causes a loop.
  const allFlowCookies = [
    APP_FLOW_COOKIE_NAME,
    CIVIS_BFF_STATE,
    CIVIS_BFF_VERIFIER,
    CIVIS_BFF_NONCE,
    PKCE_COOKIE_NAME,
  ];

  // ── Resolve PKCE state + verifier + nonce ─────────────────────────────────
  let storedState: string | undefined =
    request.cookies.get(CIVIS_BFF_STATE)?.value;
  let codeVerifier: string | undefined =
    request.cookies.get(CIVIS_BFF_VERIFIER)?.value;
  let storedNonce: string | undefined =
    request.cookies.get(CIVIS_BFF_NONCE)?.value;

  if (!storedState || !codeVerifier) {
    const pkceRaw = request.cookies.get(PKCE_COOKIE_NAME)?.value;
    const secret = getEnv("SESSION_SECRET");
    if (pkceRaw && secret) {
      const pkce = await decodePkceState(pkceRaw, secret);
      if (pkce) {
        storedState = pkce.state;
        codeVerifier = pkce.codeVerifier;
        storedNonce = pkce.nonce;
        if (pkce.locale) locale = pkce.locale;
        if (pkce.returnTo) returnTo = pkce.returnTo;
      }
    }
  }

  // ── Handle CAS error response ─────────────────────────────────────────────
  if (errorParam) {
    const desc = searchParams.get("error_description") ?? errorParam;
    return loginRedirectResponse(locale, allFlowCookies, desc);
  }

  if (!code || !stateParam) {
    return new Response(JSON.stringify({ error: "Missing code or state" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!storedState || storedState !== stateParam) {
    return loginRedirectResponse(locale, allFlowCookies, "state_mismatch");
  }

  if (!codeVerifier) {
    return loginRedirectResponse(locale, allFlowCookies, "state_mismatch");
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

  if (!result.ok) {
    const desc = result.error.error_description ?? result.error.error;
    return loginRedirectResponse(locale, allFlowCookies, desc);
  }

  const { access_token, id_token, refresh_token, expires_in } = result.tokens;

  // ── Verify ID token and access token ──────────────────────────────────────
  // Defense-in-depth: confirms the tokens CAS returned are signed by CAS, not
  // expired, scoped to this client, and that the id_token matches the nonce
  // this browser generated, preventing token substitution/replay.
  // UiBffSessionService performs the authoritative verification when the BFF
  // session is created below.
  if (!storedNonce) {
    return loginRedirectResponse(locale, allFlowCookies, "state_mismatch");
  }
  const verifiedIdToken = await verifyIdToken(id_token, {
    issuer: casUrl,
    clientId,
    nonce: storedNonce,
  });
  if (!verifiedIdToken) {
    return loginRedirectResponse(locale, allFlowCookies, "state_mismatch");
  }
  const verifiedAccessToken = await verifyAccessToken(access_token, {
    issuer: casUrl,
  });
  if (!verifiedAccessToken) {
    return loginRedirectResponse(locale, allFlowCookies, "invalid_token");
  }

  const civisCoreUrl =
    getEnv("CIVIS_CORE_URL") ?? casUrl.replace(":9000", ":8080");
  const tenants = await resolveTenantsFromToken(access_token, civisCoreUrl);
  const activeTenantId =
    activeTenantIdFromToken(access_token) ??
    (tenants.length === 1 ? tenants[0]?.id : undefined);
  const secure = isSecure();

  const safeReturnTo = sanitizeReturnTo(returnTo, `/${locale}/console`);
  const isReactivation = appFlow?.flow === "reactivate";
  const sessionHandle = appFlow?.sessionHandle;
  const destination =
    !isReactivation && !activeTenantId && tenants.length > 1
      ? `/${locale}/select-tenant?returnTo=${encodeURIComponent(safeReturnTo)}`
      : safeReturnTo;

  if (isReactivation && !sessionHandle) {
    return loginRedirectResponse(locale, allFlowCookies, "reauth_failed");
  }

  let opaqueSessionHandle: string | undefined;
  let storedSession: BffSessionResponse | undefined;
  if (isReactivation && sessionHandle) {
    opaqueSessionHandle = sessionHandle;
    storedSession = await reactivateBffSession({
      handle: sessionHandle,
      accessToken: access_token,
      idToken: id_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      ...(appFlow?.reauthStartedAt
        ? { reauthStartedAt: appFlow.reauthStartedAt }
        : {}),
    });
  } else {
    const sessionStoreResult = await createBffSession({
      accessToken: access_token,
      idToken: id_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      tenants,
      ...(activeTenantId !== undefined ? { activeTenantId } : {}),
    });
    opaqueSessionHandle = sessionStoreResult?.handle;
    storedSession = sessionStoreResult?.session;
  }

  if (!opaqueSessionHandle || storedSession?.status !== "ACTIVE") {
    return loginRedirectResponse(
      locale,
      allFlowCookies,
      isReactivation ? "reauth_failed" : "session_store_unavailable",
    );
  }

  // ── Build response with explicit Set-Cookie headers ────────────────────────
  // Using raw Response + Headers to guarantee Set-Cookie headers are included
  // in the redirect. next/headers cookies().set() combined with NextResponse
  // is unreliable in Next.js 15 Route Handlers (headers may be dropped).
  const headers = new Headers({
    Location: new URL(destination, baseUrl).toString(),
  });

  // Session cookie — the critical one
  headers.append(
    "Set-Cookie",
    setCookie(
      SESSION_COOKIE_NAME,
      opaqueSessionHandle,
      SESSION_COOKIE_MAX_AGE,
      secure,
    ),
  );

  // Tenant context cookie — enables middleware to forward tenant_id on next login
  const tenantCtxId =
    activeTenantId ??
    storedSession.metadata?.activeTenantId ??
    (tenants.length === 1 ? tenants[0]?.id : undefined);
  if (tenantCtxId) {
    const tenantCtxValue = await encodeTenantCtxCookie(
      tenantCtxId,
      sessionSecret,
    );
    headers.append(
      "Set-Cookie",
      setCookie(
        TENANT_CTX_COOKIE_NAME,
        tenantCtxValue,
        TENANT_CTX_COOKIE_MAX_AGE,
        secure,
      ),
    );
  }

  // Delete all flow cookies
  for (const name of allFlowCookies) {
    headers.append("Set-Cookie", deleteCookie(name));
  }

  // Suppress reading from cookieStore (avoid any stale pending state leaking in)
  void cookieStore;

  return new Response(null, { status: 307, headers });
}
