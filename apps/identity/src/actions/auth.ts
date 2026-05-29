"use server";

import {
  encodePkceState,
  generateCodeChallenge,
  generatePkceState,
  PKCE_COOKIE_NAME,
} from "@repo/auth";
import { getEnv, requireEnv } from "@repo/platform";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const PKCE_COOKIE_MAX_AGE_SECONDS = 600;

function isSecure(): boolean {
  const env = getEnv("NEXT_PUBLIC_APP_ENV");
  return env === "production" || env === "staging";
}

/**
 * Redirects to GET /api/auth/login which bootstraps the OAuth2 PKCE flow
 * via the civis-core BFF and redirects to CAS. Used from form-based flows
 * (register page) where a direct anchor link isn't possible.
 */
export async function initiateLogin(
  locale: string,
  returnTo?: string,
): Promise<void> {
  const params = new URLSearchParams({ locale });
  if (returnTo) params.set("returnTo", returnTo);
  redirect(`/api/auth/login?${params.toString()}`);
}

/**
 * Initiates a direct OIDC federation login, bypassing the CAS credential
 * form and routing straight to the tenant's configured enterprise IdP.
 */
export async function initiateEnterpriseSSO(
  locale: string,
  tenantId: string,
  providerKey: string,
  returnTo?: string,
): Promise<void> {
  const casUrl = requireEnv("CAS_ISSUER_URL");
  const clientId = requireEnv("CAS_BFF_CLIENT_ID");
  const baseUrl = requireEnv("JURIS_BASE_URL");
  const sessionSecret = requireEnv("SESSION_SECRET");

  const pkce = await generatePkceState();
  const codeChallenge = await generateCodeChallenge(pkce.codeVerifier);
  const redirectUri = `${baseUrl}/${locale}/auth/callback`;

  const encryptedPkce = await encodePkceState(
    {
      state: pkce.state,
      nonce: pkce.nonce,
      codeVerifier: pkce.codeVerifier,
      locale,
      returnTo: returnTo ?? `/${locale}/console`,
    },
    sessionSecret,
  );

  const cookieStore = await cookies();
  cookieStore.set(PKCE_COOKIE_NAME, encryptedPkce, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: PKCE_COOKIE_MAX_AGE_SECONDS,
    secure: isSecure(),
  });

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
  authorizeUrl.searchParams.set("kc_idp_hint", `${tenantId}/${providerKey}`);

  redirect(authorizeUrl.toString());
}
