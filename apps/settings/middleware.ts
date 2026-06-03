import { createAuthMiddleware } from "@repo/auth";
import { defaultLocale, isLocale } from "@repo/i18n";
import { getEnv } from "@repo/platform";
import { CSP_NONCE_HEADER, createNonce, getSecurityHeaders } from "@repo/security";
import { NextResponse } from "next/server";

export const middleware = createAuthMiddleware(
  { app: "settings" },
  {
    createNonce,
    nonceHeader: CSP_NONCE_HEADER,
    isLocale,
    defaultLocale,
    applySecurityHeaders(response, nonce) {
      const headers = getSecurityHeaders({
        environment: getEnv("NEXT_PUBLIC_APP_ENV") ?? "production",
        nonce,
        appName: "juris",
      });
      for (const [k, v] of Object.entries(headers)) {
        response.headers.set(k, v);
      }
    },
  },
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
