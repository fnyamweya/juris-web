/**
 * Centralized validation for `returnTo`-style redirect targets (AUTH-008).
 *
 * `returnTo` values flow from query parameters and signed-but-attacker-influenced
 * flow cookies into `Location` headers. A value that isn't a strict, single
 * leading-slash, app-relative path can be used for open-redirect or
 * protocol-relative attacks (`//evil.example`, `/\evil.example`,
 * `https://evil.example`, percent-encoded variants of the above, etc.).
 *
 * `sanitizeReturnTo` rejects anything that doesn't pass these checks and
 * returns `fallback` instead — callers should never need their own
 * `returnTo.startsWith("/")`-style checks.
 */

function hasControlCharacters(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

function isUnsafe(value: string): boolean {
  if (value.startsWith("//")) return true; // protocol-relative ("//evil.example")
  if (value.includes("\\")) return true; // some parsers treat "\" as "/"
  if (value.includes("://")) return true; // embedded scheme ("/x:/\evil" etc.)
  if (hasControlCharacters(value)) return true; // header-injection / control chars
  return false;
}

/**
 * Validates `value` as a safe app-relative redirect target, returning
 * `fallback` if it is missing, malformed, or potentially dangerous.
 *
 * Optionally, `allowedPrefixes` restricts the result to paths starting with
 * one of the given prefixes (each checked as an exact match or followed by
 * `/`, `?`, or `#`).
 */
export function sanitizeReturnTo(
  value: string | null | undefined,
  fallback: string,
  options?: { allowedPrefixes?: readonly string[] },
): string {
  if (typeof value !== "string" || value.length === 0) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (isUnsafe(value)) return fallback;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (isUnsafe(decoded)) return fallback;

  const allowedPrefixes = options?.allowedPrefixes;
  if (allowedPrefixes && allowedPrefixes.length > 0) {
    const allowed = allowedPrefixes.some(
      (prefix) =>
        decoded === prefix ||
        decoded.startsWith(`${prefix}/`) ||
        decoded.startsWith(`${prefix}?`) ||
        decoded.startsWith(`${prefix}#`),
    );
    if (!allowed) return fallback;
  }

  return value;
}
