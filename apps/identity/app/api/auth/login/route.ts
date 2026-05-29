import {
  encodePkceState,
  generateCodeChallenge,
  generatePkceState,
  PKCE_COOKIE_NAME,
} from "@repo/auth";
import { getEnv, requireEnv } from "@repo/platform";
import { NextResponse, type NextRequest } from "next/server";
import {
  APP_FLOW_COOKIE_NAME,
  CIVIS_BFF_NONCE,
  CIVIS_BFF_STATE,
  CIVIS_BFF_VERIFIER,
} from "@/lib/bff-cookies";

// 15 minutes — long enough for users navigating back/forward during the flow
// without expiring cookies mid-session.
const FLOW_COOKIE_MAX_AGE = 900;

type BffLoginData = {
  authorizeUrl: string;
};

function isSecure(request: NextRequest): boolean {
  const env = getEnv("NEXT_PUBLIC_APP_ENV");
  if (env === "production" || env === "staging") return true;
  return request.nextUrl.protocol === "https:";
}

function getSetCookieStrings(headers: Headers): string[] {
  const proto = Object.getPrototypeOf(headers) as Record<string, unknown>;
  if (typeof proto["getSetCookie"] === "function") {
    return (headers as unknown as { getSetCookie(): string[] }).getSetCookie();
  }
  const raw = headers.get("set-cookie") ?? "";
  if (!raw) return [];
  return raw.split(/,(?=\s*[A-Za-z0-9_-]+=)/).map((s) => s.trim());
}

/**
 * GET /api/auth/login
 *
 * Initiates the OAuth2 PKCE authorization flow. Calls the civis-core BFF
 * bootstrap endpoint to get the CAS authorization URL and PKCE state cookies,
 * then redirects the browser to CAS for credential entry.
 *
 * Falls back to generating PKCE locally if civis-core is unreachable so the
 * login page is never blocked by the API being down.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;
  const locale = searchParams.get("locale") ?? "en";
  const returnTo = searchParams.get("returnTo") ?? `/${locale}/console`;
  const safeReturnTo = returnTo.startsWith("/") ? returnTo : `/${locale}/console`;

  const civisCoreUrl = requireEnv("CIVIS_CORE_URL");
  const baseUrl = requireEnv("JURIS_BASE_URL");
  const redirectUri = `${baseUrl}/oauth/callback`;
  const secure = isSecure(request);

  const appFlowCookie = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    maxAge: FLOW_COOKIE_MAX_AGE,
    secure,
  };

  // ── Primary: delegate PKCE to civis-core BFF ─────────────────────────────
  const bffUrl = new URL(`${civisCoreUrl}/v1/ui/login/bff`);
  bffUrl.searchParams.set("redirectUri", redirectUri);

  try {
    const res = await fetch(bffUrl.toString(), {
      method: "POST",
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const body = (await res.json()) as { data: BffLoginData };
      const response = NextResponse.redirect(new URL(body.data.authorizeUrl));

      for (const cookieStr of getSetCookieStrings(res.headers)) {
        const nameValue = cookieStr.split(";")[0]?.trim() ?? "";
        const eqIdx = nameValue.indexOf("=");
        if (eqIdx === -1) continue;
        const name = nameValue.substring(0, eqIdx).trim();
        const value = nameValue.substring(eqIdx + 1).trim();
        if (name !== CIVIS_BFF_VERIFIER && name !== CIVIS_BFF_STATE && name !== CIVIS_BFF_NONCE) {
          continue;
        }
        response.cookies.set(name, value, appFlowCookie);
      }

      response.cookies.set(
        APP_FLOW_COOKIE_NAME,
        JSON.stringify({ locale, returnTo: safeReturnTo }),
        appFlowCookie,
      );

      return response;
    }
  } catch {
    // civis-core unreachable — fall through to local PKCE generation
  }

  // ── Fallback: generate PKCE locally ──────────────────────────────────────
  const casUrl = getEnv("CAS_ISSUER_URL");
  const clientId = getEnv("CAS_BFF_CLIENT_ID");
  const sessionSecret = getEnv("SESSION_SECRET");

  if (!casUrl || !clientId || !sessionSecret) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=auth_unavailable`, baseUrl),
    );
  }

  const pkce = await generatePkceState();
  const codeChallenge = await generateCodeChallenge(pkce.codeVerifier);

  const encryptedPkce = await encodePkceState(
    {
      state: pkce.state,
      nonce: pkce.nonce,
      codeVerifier: pkce.codeVerifier,
      locale,
      returnTo: safeReturnTo,
    },
    sessionSecret,
  );

  const authorizeUrl = new URL(`${casUrl}/oauth2/authorize`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set(
    "scope",
    "openid profile email offline_access platform.api tenant.api",
  );
  authorizeUrl.searchParams.set("state", pkce.state);
  authorizeUrl.searchParams.set("nonce", pkce.nonce);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(PKCE_COOKIE_NAME, encryptedPkce, appFlowCookie);
  response.cookies.set(
    APP_FLOW_COOKIE_NAME,
    JSON.stringify({ locale, returnTo: safeReturnTo }),
    appFlowCookie,
  );

  return response;
}
