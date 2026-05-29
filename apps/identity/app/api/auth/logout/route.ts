import {
  decodeSessionCookie,
  revokeToken,
  SESSION_COOKIE_NAME,
} from "@repo/auth";
import { getEnv, requireEnv } from "@repo/platform";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;
  const locale = searchParams.get("locale") ?? "en";

  const cookieStore = await cookies();
  const sessionRaw = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  let idToken: string | null = null;

  if (sessionRaw) {
    const secret = getEnv("SESSION_SECRET");
    if (secret) {
      const payload = await decodeSessionCookie(sessionRaw, secret);

      // Capture the id_token before clearing — needed for OIDC end-session hint
      idToken = payload?.it ?? null;

      if (payload?.rt) {
        const casUrl = requireEnv("CAS_ISSUER_URL");
        const clientId = requireEnv("CAS_BFF_CLIENT_ID");
        const clientSecret = requireEnv("CAS_BFF_CLIENT_SECRET");

        await revokeToken({
          casUrl,
          clientId,
          clientSecret,
          token: payload.rt,
          tokenTypeHint: "refresh_token",
        }).catch(() => {
          // Best-effort — always clear local session even if revocation fails
        });
      }
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  // Propagate logout to CAS via OIDC RP-Initiated Logout so the CAS session
  // is also cleared. Without this, clicking "Sign in" again would silently
  // re-authenticate the user from the still-active CAS session.
  const casUrl = getEnv("CAS_ISSUER_URL");
  const baseUrl = getEnv("JURIS_BASE_URL");

  if (casUrl && baseUrl) {
    const endSessionUrl = new URL(`${casUrl}/connect/logout`);
    endSessionUrl.searchParams.set(
      "post_logout_redirect_uri",
      `${baseUrl}/${locale}/logout`,
    );
    if (idToken) {
      endSessionUrl.searchParams.set("id_token_hint", idToken);
    }
    return Response.redirect(endSessionUrl.toString(), 302);
  }

  // Fallback: no CAS URL configured (mock session mode)
  return Response.redirect(new URL(`/${locale}/logout`, request.url), 302);
}
