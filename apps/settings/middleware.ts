import { defaultLocale, isLocale } from "@repo/i18n";
import { getEnv } from "@repo/platform";
import {
  createNonce,
  CSP_NONCE_HEADER,
  getSecurityHeaders,
} from "@repo/security";
import {
  decodeSessionCookie,
  refreshAccessToken,
  encodeSessionCookie,
  SESSION_COOKIE_NAME,
} from "@repo/auth";
import type { SessionPayload } from "@repo/auth";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_APP = "settings";
const REFRESH_THRESHOLD_SECONDS = 60;
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function isSecure(): boolean {
  const env = getEnv("NEXT_PUBLIC_APP_ENV");
  return env === "production" || env === "staging";
}

function withSecurityHeaders(
  response: NextResponse,
  nonce: string,
): NextResponse {
  const headers = getSecurityHeaders({
    environment:
      getEnv("NEXT_PUBLIC_APP_ENV") ?? getEnv("NODE_ENV") ?? "production",
    nonce,
    appName: "juris",
  });
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

function loginRedirect(
  request: NextRequest,
  locale: string,
  nonce: string,
): NextResponse {
  const returnTo = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
  const loginUrl = new URL(
    `/${locale}/login?returnTo=${returnTo}`,
    request.url,
  );
  return withSecurityHeaders(NextResponse.redirect(loginUrl), nonce);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSP_NONCE_HEADER, nonce);

  // Pass through static assets and API health routes
  if (
    pathname.startsWith("/api/health/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return withSecurityHeaders(NextResponse.next(), nonce);
  }

  // Resolve locale
  const segments = pathname.split("/");
  const localeSegment = segments[1] ?? "";

  if (!isLocale(localeSegment)) {
    const url = request.nextUrl.clone();
    url.pathname = "/" + defaultLocale + (pathname === "/" ? "" : pathname);
    return withSecurityHeaders(NextResponse.redirect(url), nonce);
  }

  const locale = localeSegment;

  // Skip auth for health check paths with locale prefix
  if (pathname.includes(`/${PROTECTED_APP}/api/health/`)) {
    return withSecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      nonce,
    );
  }

  // ─── Auth guard ──────────────────────────────────────────────────────────

  const secret = getEnv("SESSION_SECRET");

  // If no secret configured, fall through (allows USE_MOCK_SESSION dev mode)
  if (secret) {
    const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!cookieValue) {
      return loginRedirect(request, locale, nonce);
    }

    const payload = await decodeSessionCookie(cookieValue, secret);

    if (!payload) {
      const response = loginRedirect(request, locale, nonce);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);

    if (payload.exp <= nowSeconds) {
      // Access token is expired — attempt silent refresh
      const refreshed = await attemptRefresh(payload, secret);

      if (!refreshed) {
        const response = loginRedirect(request, locale, nonce);
        response.cookies.delete(SESSION_COOKIE_NAME);
        return response;
      }

      // Refresh succeeded — update cookie and continue
      const encryptedSession = await encodeSessionCookie(refreshed, secret);
      const response = withSecurityHeaders(
        NextResponse.next({ request: { headers: requestHeaders } }),
        nonce,
      );
      response.cookies.set(SESSION_COOKIE_NAME, encryptedSession, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_COOKIE_MAX_AGE,
        secure: isSecure(),
      });
      return response;
    }

    // Proactive refresh when within threshold of expiry
    if (payload.exp - nowSeconds < REFRESH_THRESHOLD_SECONDS) {
      const refreshed = await attemptRefresh(payload, secret);
      if (refreshed) {
        const encryptedSession = await encodeSessionCookie(refreshed, secret);
        const response = withSecurityHeaders(
          NextResponse.next({ request: { headers: requestHeaders } }),
          nonce,
        );
        response.cookies.set(SESSION_COOKIE_NAME, encryptedSession, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_COOKIE_MAX_AGE,
          secure: isSecure(),
        });
        return response;
      }
    }
  }

  return withSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    nonce,
  );
}

async function attemptRefresh(
  payload: SessionPayload,
  secret: string,
): Promise<SessionPayload | null> {
  const casUrl = getEnv("CAS_ISSUER_URL");
  const clientId = getEnv("CAS_BFF_CLIENT_ID");
  const clientSecret = getEnv("CAS_BFF_CLIENT_SECRET");

  if (!casUrl || !clientId || !clientSecret) return null;

  const result = await refreshAccessToken({
    casUrl,
    clientId,
    clientSecret,
    refreshToken: payload.rt,
  }).catch(() => null);

  if (!result?.ok) return null;

  const { access_token, id_token, refresh_token, expires_in } = result.tokens;

  return {
    at: access_token,
    it: id_token,
    rt: refresh_token,
    exp: Math.floor(Date.now() / 1000) + expires_in,
    tenants: payload.tenants,
  };
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
