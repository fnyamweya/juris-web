import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

/**
 * Algorithms accepted for CAS-issued tokens. Excludes `none` and HMAC-family
 * algorithms (HS256/384/512) so a token cannot be forged with a public key or
 * with no signature at all.
 */
const ALLOWED_ALGORITHMS = ["RS256", "ES256"];

/** Audience CAS issues on access tokens for civis-core API calls. */
const DEFAULT_RESOURCE_AUDIENCE = "civis-core";

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksFor(issuer: string): ReturnType<typeof createRemoteJWKSet> {
  let jwks = jwksCache.get(issuer);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/oauth2/jwks`));
    jwksCache.set(issuer, jwks);
  }
  return jwks;
}

function audienceList(aud: JWTPayload["aud"]): string[] {
  if (!aud) return [];
  return Array.isArray(aud) ? aud : [aud];
}

export type VerifiedIdTokenClaims = JWTPayload & { sub: string };

/**
 * Verifies an ID token's signature, issuer, algorithm, expiry, audience/azp
 * (OpenID Connect Core 1.0 §3.1.3.7), and `nonce`.
 *
 * This is a defense-in-depth check: `UiBffSessionService` performs the
 * authoritative verification when the BFF session is created. Returns the
 * verified claims, or `null` if any check fails.
 */
export async function verifyIdToken(
  idToken: string,
  options: { issuer: string; clientId: string; nonce: string },
): Promise<VerifiedIdTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(idToken, jwksFor(options.issuer), {
      issuer: options.issuer,
      audience: options.clientId,
      algorithms: ALLOWED_ALGORITHMS,
    });
    if (!payload.sub) return null;
    if (payload.nonce !== options.nonce) return null;
    const audiences = audienceList(payload.aud);
    if (audiences.length > 1 && payload.azp !== options.clientId) return null;
    return payload as VerifiedIdTokenClaims;
  } catch {
    return null;
  }
}

/**
 * Verifies an access token's signature, issuer, algorithm, expiry, and
 * audience.
 *
 * This is a defense-in-depth check: `UiBffSessionService` performs the
 * authoritative verification when the BFF session is created/refreshed.
 * Returns the verified claims, or `null` if any check fails.
 */
export async function verifyAccessToken(
  accessToken: string,
  options: { issuer: string; audience?: string },
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(accessToken, jwksFor(options.issuer), {
      issuer: options.issuer,
      audience: options.audience ?? DEFAULT_RESOURCE_AUDIENCE,
      algorithms: ALLOWED_ALGORITHMS,
    });
    return payload;
  } catch {
    return null;
  }
}
