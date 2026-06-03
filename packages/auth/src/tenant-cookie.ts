/**
 * Signed tenant-ctx cookie utilities.
 *
 * The tenant-ctx cookie tells protected-app middlewares which tenant to pass
 * as tenant_id on the next CAS authorize request. It must be tamper-proof:
 * an attacker who can write an arbitrary cookie value must not be able to
 * route themselves into a different tenant's auth config.
 *
 * Format: <tenantId>.<base64url(HMAC-SHA256(tenantId, SESSION_SECRET))>
 *
 * Verification uses a timing-safe comparison so the signature cannot be
 * brute-forced byte-by-byte via timing side-channels.
 */

export const TENANT_CTX_COOKIE_NAME = "tenant-ctx";
export const TENANT_CTX_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(tenantId: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(tenantId),
  );
  return base64UrlEncode(sig);
}

/** Encodes a signed tenant-ctx cookie value. */
export async function encodeTenantCtxCookie(
  tenantId: string,
  secret: string,
): Promise<string> {
  const sig = await sign(tenantId, secret);
  return `${tenantId}.${sig}`;
}

/**
 * Decodes and verifies a tenant-ctx cookie value.
 * Returns the verified tenantId, or null if the value is missing, malformed,
 * or the signature does not match (timing-safe comparison).
 */
export async function decodeTenantCtxCookie(
  cookieValue: string,
  secret: string,
): Promise<string | null> {
  if (!cookieValue) return null;

  const dotIndex = cookieValue.indexOf(".");
  if (dotIndex <= 0 || dotIndex === cookieValue.length - 1) return null;

  const tenantId = cookieValue.substring(0, dotIndex);
  const providedSig = cookieValue.substring(dotIndex + 1);

  if (!tenantId || !providedSig) return null;

  try {
    // Re-derive the expected signature and compare with timing-safe verify.
    const key = await hmacKey(secret);
    const providedBytes = base64UrlDecode(providedSig);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      providedBytes,
      new TextEncoder().encode(tenantId),
    );
    return valid ? tenantId : null;
  } catch {
    return null;
  }
}
