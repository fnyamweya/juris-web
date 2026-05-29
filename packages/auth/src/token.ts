import { getEnv } from "@repo/platform";
import { decodeSessionCookie, SESSION_COOKIE_NAME } from "./session-codec";

/**
 * Returns the raw Bearer access token from the encrypted session cookie.
 * Server-side only — requires next/headers (Next.js runtime).
 * Returns null when there is no valid session or the token is expired.
 */
export async function getAccessToken(): Promise<string | null> {
  const secret = getEnv("SESSION_SECRET");
  if (!secret) return null;

  let cookieValue: string | undefined;
  try {
    const nextHeaders = await import(/* @vite-ignore */ "next/headers").catch(
      () => null,
    );
    if (nextHeaders) {
      const store = await nextHeaders.cookies();
      cookieValue = store.get(SESSION_COOKIE_NAME)?.value;
    }
  } catch {
    return null;
  }

  if (!cookieValue) return null;

  const payload = await decodeSessionCookie(cookieValue, secret);
  if (!payload) return null;
  if (payload.exp * 1000 < Date.now()) return null;

  return payload.at;
}
