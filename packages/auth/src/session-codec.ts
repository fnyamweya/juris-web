import { encrypt, decrypt } from "./crypto";
import type { SessionPayload, PkcePayload } from "./types";

export const SESSION_COOKIE_NAME = "juris-session";
export const PKCE_COOKIE_NAME = "juris-pkce";

export async function encodeSessionCookie(
  payload: SessionPayload,
  secret: string,
): Promise<string> {
  return encrypt(JSON.stringify(payload), secret);
}

export async function decodeSessionCookie(
  value: string,
  secret: string,
): Promise<SessionPayload | null> {
  const raw = await decrypt(value, secret);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionPayload;
  } catch {
    return null;
  }
}

export async function encodePkceState(
  payload: PkcePayload,
  secret: string,
): Promise<string> {
  return encrypt(JSON.stringify(payload), secret);
}

export async function decodePkceState(
  value: string,
  secret: string,
): Promise<PkcePayload | null> {
  const raw = await decrypt(value, secret);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PkcePayload;
  } catch {
    return null;
  }
}
