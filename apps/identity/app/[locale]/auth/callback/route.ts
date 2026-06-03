import {
  createBffSession,
  decodePkceState,
  encodeTenantCtxCookie,
  exchangeAuthorizationCode,
  PKCE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  TENANT_CTX_COOKIE_MAX_AGE,
  TENANT_CTX_COOKIE_NAME,
} from "@repo/auth";
import { getEnv, requireEnv } from "@repo/platform";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import {
  activeTenantIdFromToken,
  resolveTenantsFromToken,
} from "@/lib/tenant-resolution";

const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function isSecure(): boolean {
  const env = getEnv("NEXT_PUBLIC_APP_ENV");
  return env === "production" || env === "staging";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { locale } = await params;
  const { searchParams } = request.nextUrl;

  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    const desc = searchParams.get("error_description") ?? errorParam;
    redirect(`/${locale}/login?error=${encodeURIComponent(desc)}`);
  }

  if (!code || !stateParam) {
    return new Response(JSON.stringify({ error: "Missing code or state" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sessionSecret = requireEnv("SESSION_SECRET");
  const casUrl = requireEnv("CAS_ISSUER_URL");
  const clientId = requireEnv("CAS_BFF_CLIENT_ID");
  const clientSecret = requireEnv("CAS_BFF_CLIENT_SECRET");
  const baseUrl = requireEnv("JURIS_BASE_URL");

  const cookieStore = await cookies();
  const pkceRaw = cookieStore.get(PKCE_COOKIE_NAME)?.value;

  if (!pkceRaw) {
    redirect(`/${locale}/login?error=session_expired`);
  }

  const pkce = await decodePkceState(pkceRaw, sessionSecret);

  if (!pkce || pkce.state !== stateParam) {
    cookieStore.delete(PKCE_COOKIE_NAME);
    redirect(`/${locale}/login?error=state_mismatch`);
  }

  const redirectUri = `${baseUrl}/${locale}/auth/callback`;

  const result = await exchangeAuthorizationCode({
    casUrl,
    clientId,
    clientSecret,
    code,
    redirectUri,
    codeVerifier: pkce.codeVerifier,
  });

  // Always clear PKCE cookie whether exchange succeeded or failed
  cookieStore.delete(PKCE_COOKIE_NAME);

  if (!result.ok) {
    const desc = result.error.error_description ?? result.error.error;
    redirect(`/${locale}/login?error=${encodeURIComponent(desc)}`);
  }

  const { access_token, id_token, refresh_token, expires_in } = result.tokens;

  // Resolve tenant display names from civis-core (best-effort; falls back to id)
  const civisCoreUrl =
    getEnv("CIVIS_CORE_URL") ?? casUrl.replace(":9000", ":8080");
  const tenants = await resolveTenantsFromToken(access_token, civisCoreUrl);
  const activeTenantId = activeTenantIdFromToken(access_token);

  const bffSession = await createBffSession({
    accessToken: access_token,
    idToken: id_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    tenants,
    ...(activeTenantId !== undefined ? { activeTenantId } : {}),
  });
  if (!bffSession || bffSession.session.status !== "ACTIVE") {
    redirect(`/${locale}/login?error=session_store_unavailable`);
  }

  const secure = isSecure();
  const destination = pkce.returnTo ?? `/${locale}/console`;

  const securePart = secure ? "; Secure" : "";
  const headers = new Headers({
    Location: new URL(destination, baseUrl).toString(),
  });
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${bffSession.handle}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}${securePart}`,
  );
  const tenantCtxId =
    activeTenantId ?? (tenants.length === 1 ? tenants[0]?.id : undefined);
  if (tenantCtxId) {
    const tenantCtxValue = await encodeTenantCtxCookie(
      tenantCtxId,
      sessionSecret,
    );
    headers.append(
      "Set-Cookie",
      `${TENANT_CTX_COOKIE_NAME}=${tenantCtxValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TENANT_CTX_COOKIE_MAX_AGE}${securePart}`,
    );
  }
  // Clean up PKCE cookie
  headers.append(
    "Set-Cookie",
    `${PKCE_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );

  void cookieStore;
  return new Response(null, { status: 307, headers });
}
