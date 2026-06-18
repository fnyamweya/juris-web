/**
 * Shared Next.js middleware factory for all protected apps in the Juris monorepo.
 *
 * Usage in each app's middleware.ts:
 *
 *   import { createAuthMiddleware } from "@repo/auth";
 *   import { defaultLocale, isLocale } from "@repo/i18n";
 *   import { getEnv } from "@repo/platform";
 *   import { CSP_NONCE_HEADER, createNonce, getSecurityHeaders } from "@repo/security";
 *   import { NextResponse } from "next/server";
 *
 *   export const middleware = createAuthMiddleware(
 *     { app: "console" },
 *     {
 *       createNonce,
 *       nonceHeader: CSP_NONCE_HEADER,
 *       isLocale,
 *       defaultLocale,
 *       applySecurityHeaders(response, nonce) {
 *         const h = getSecurityHeaders({ environment: getEnv("NEXT_PUBLIC_APP_ENV") ?? "production", nonce, appName: "juris" });
 *         for (const [k, v] of Object.entries(h)) response.headers.set(k, v);
 *       },
 *     },
 *   );
 *
 *   export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
 *
 * Design decisions:
 * - BFF sessions only. The legacy encrypted-cookie path has been removed; sessions
 *   created with the old format will be treated as invalid handles, clearing the
 *   cookie and redirecting to login. This is safe — legacy cookies expire in ≤7 days.
 * - Security headers are applied to EVERY response (pass, redirect, locked) so
 *   no response leaks without the security policy.
 * - No module-level side effects. The factory is a pure function.
 */

import { getEnv } from "@repo/platform";
import { NextResponse, type NextRequest } from "next/server";
import { ensureBffSession } from "./bff-session";
import { SESSION_COOKIE_NAME } from "./session-codec";
import { decodeTenantCtxCookie, TENANT_CTX_COOKIE_NAME } from "./tenant-cookie";

/** Options that vary per app. */
export interface AuthMiddlewareOptions {
  /**
   * Short app name used to exclude `/<app>/api/health/` from auth checks.
   * Must match the URL path segment (e.g. "console", "admin", "billing").
   */
  app: string;
}

/**
 * Dependencies injected by each app, keeping this module free of direct
 * `@repo/security` and `@repo/i18n` imports.
 */
export interface AuthMiddlewareDeps {
  /** Cryptographically random nonce for CSP. */
  createNonce: () => string;
  /** Request header name under which the nonce is forwarded to pages. */
  nonceHeader: string;
  /** Returns true when the given URL segment is a valid locale code. */
  isLocale: (segment: string) => boolean;
  /** Locale to use when the URL path has none (e.g. "en"). */
  defaultLocale: string;
  /**
   * Mutates `response` with security headers (CSP, HSTS, Referrer-Policy, etc.).
   * Called on every response — pass, redirect, and locked — so no response leaks
   * without the security policy.
   */
  applySecurityHeaders: (response: NextResponse, nonce: string) => void;
}

const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Creates the Next.js middleware function for a protected app.
 * Returns a single async function compatible with Next.js `middleware.ts` exports.
 */
export function createAuthMiddleware(
  opts: AuthMiddlewareOptions,
  deps: AuthMiddlewareDeps,
): (request: NextRequest) => Promise<NextResponse> {
  const { app } = opts;
  const { createNonce, nonceHeader, isLocale, defaultLocale, applySecurityHeaders } = deps;

  function secure(response: NextResponse, nonce: string): NextResponse {
    applySecurityHeaders(response, nonce);
    return response;
  }

  async function toLoginRedirect(
    request: NextRequest,
    locale: string,
    nonce: string,
    secret: string,
  ): Promise<NextResponse> {
    const returnTo = encodeURIComponent(
      request.nextUrl.pathname + request.nextUrl.search,
    );
    const loginUrl = new URL(
      `/${locale}/login?returnTo=${returnTo}`,
      request.url,
    );
    // Forward tenant context so CAS can pre-select the correct IdP / login page.
    const tenantCtxRaw = request.cookies.get(TENANT_CTX_COOKIE_NAME)?.value;
    if (tenantCtxRaw) {
      const tenantId = await decodeTenantCtxCookie(tenantCtxRaw, secret).catch(
        () => null,
      );
      if (tenantId) loginUrl.searchParams.set("tenant_id", tenantId);
    }
    return secure(NextResponse.redirect(loginUrl), nonce);
  }

  function toLockedRedirect(
    request: NextRequest,
    locale: string,
    nonce: string,
  ): NextResponse {
    const returnTo = encodeURIComponent(
      request.nextUrl.pathname + request.nextUrl.search,
    );
    const lockedUrl = new URL(
      `/${locale}/session/locked?returnTo=${returnTo}`,
      request.url,
    );
    return secure(NextResponse.redirect(lockedUrl), nonce);
  }

  return async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;
    const nonce = createNonce();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(nonceHeader, nonce);

    // ── Static assets and health routes ─────────────────────────────────────

    if (
      pathname.startsWith("/_next/") ||
      pathname === "/favicon.ico" ||
      pathname.startsWith("/api/health/") ||
      pathname.startsWith("/api/session/")
    ) {
      return secure(NextResponse.next({ request: { headers: requestHeaders } }), nonce);
    }

    // ── Locale detection ─────────────────────────────────────────────────────

    const localeSegment = pathname.split("/")[1] ?? "";

    if (!isLocale(localeSegment)) {
      const url = request.nextUrl.clone();
      url.pathname =
        "/" + defaultLocale + (pathname === "/" ? "" : pathname);
      return secure(NextResponse.redirect(url), nonce);
    }

    const locale = localeSegment;

    // App-internal health checks (e.g. /en/console/api/health/ready)
    if (pathname.includes(`/${app}/api/health/`)) {
      return secure(
        NextResponse.next({ request: { headers: requestHeaders } }),
        nonce,
      );
    }

    // ── Auth guard ───────────────────────────────────────────────────────────
    //
    // When SESSION_SECRET is absent the app runs in mock-session dev mode —
    // skip the guard entirely so pages can use USE_MOCK_SESSION=true.

    const secret = getEnv("SESSION_SECRET");
    if (!secret) {
      return secure(
        NextResponse.next({ request: { headers: requestHeaders } }),
        nonce,
      );
    }

    const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!cookieValue) {
      return toLoginRedirect(request, locale, nonce, secret);
    }

    // BFF-only session check. Legacy encrypted-cookie sessions are no longer
    // created; stale cookies from the old format will return INVALID here and
    // redirect the user to re-authenticate (safe — those cookies expire ≤7 days).
    const bffSession = await ensureBffSession(cookieValue, {
      touch: true,
    }).catch(() => null);

    if (!bffSession || bffSession.status === "INVALID" || bffSession.status === "REVOKED" || bffSession.status === "EXPIRED") {
      const response = await toLoginRedirect(request, locale, nonce, secret);
      response.cookies.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        secure: isProductionLike(),
      });
      return response;
    }

    if (bffSession.status === "LOCKED") {
      return toLockedRedirect(request, locale, nonce);
    }

    // ACTIVE — forward with security headers. The nonce is forwarded via the
    // request header so Server Components can embed it in inline <script> and
    // <style> elements without relaxing the CSP.
    const passResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Renew the session cookie TTL on every request to prevent expiry during
    // an active browser session (rolling window).
    passResponse.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
      secure: isProductionLike(),
    });

    return secure(passResponse, nonce);
  };
}

function isProductionLike(): boolean {
  const env = getEnv("NEXT_PUBLIC_APP_ENV");
  return env === "production" || env === "staging";
}
