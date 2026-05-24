import { defaultLocale, isLocale } from "@repo/i18n";
import { getEnv } from "@repo/platform";
import {
  createNonce,
  CSP_NONCE_HEADER,
  getSecurityHeaders,
} from "@repo/security";
import { NextResponse, type NextRequest } from "next/server";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSP_NONCE_HEADER, nonce);

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return withSecurityHeaders(NextResponse.next(), nonce);
  }

  const locale = pathname.split("/")[1];

  if (!isLocale(locale)) {
    const url = request.nextUrl.clone();
    url.pathname = "/" + defaultLocale + (pathname === "/" ? "" : pathname);
    return withSecurityHeaders(NextResponse.redirect(url), nonce);
  }

  return withSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    nonce,
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
