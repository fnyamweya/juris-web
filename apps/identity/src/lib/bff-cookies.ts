// Cookie names shared between the login action and the /oauth/callback handler.
// This is a plain module (no "use server") so it can export non-function values.

/** civis-core PKCE cookies set by POST /v1/ui/login/bff */
export const CIVIS_BFF_VERIFIER = "civis_bff_pkce_verifier";
export const CIVIS_BFF_STATE = "civis_bff_oauth_state";
export const CIVIS_BFF_NONCE = "civis_bff_oidc_nonce";

/** Our cookie carrying locale + returnTo across the OAuth round-trip */
export const APP_FLOW_COOKIE_NAME = "juris-flow";
