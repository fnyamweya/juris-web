import {
  decodeSessionCookie,
  readBffSession,
  revokeBffSession,
  SESSION_COOKIE_NAME,
  TENANT_CTX_COOKIE_NAME,
} from "@repo/auth";
import { getEnv } from "@repo/platform";
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
      idToken = payload?.it ?? null;
    }

    if (!idToken) {
      const bffSession = await readBffSession(sessionRaw, false);
      idToken = bffSession.payload?.it ?? null;
    }

    // Revokes the BFF session and its upstream refresh token at CAS
    // (UiBffSessionService.revoke) — the refresh token never leaves the
    // session store, so this is the only place it can be revoked.
    await revokeBffSession(sessionRaw).catch(() => {
      // Best-effort — always clear local session even if revocation fails
    });

    cookieStore.delete(SESSION_COOKIE_NAME);

    cookieStore.delete(TENANT_CTX_COOKIE_NAME);
  }

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
