import { fetchCasCsrfHeaders } from "@repo/auth";
import { getEnv } from "@repo/platform";

// Completes a WebAuthn passkey registration by forwarding the browser's attestation to CAS's native
// WebAuthn endpoint (with the user's session cookie + CSRF token). The credential is stored in
// webauthn_credentials and becomes usable for both passwordless sign-in and MFA (AUTH-014 dual-read).
export async function POST(request: Request) {
  const casUrl = getEnv("CAS_ISSUER_URL") ?? "http://localhost:9000";
  const cookies = request.headers.get("cookie") ?? "";
  const body = await request.text();
  const csrfHeaders = await fetchCasCsrfHeaders(casUrl, cookies);
  if (!csrfHeaders) {
    return new Response(null, { status: 401 });
  }
  const res = await fetch(`${casUrl}/webauthn/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrfHeaders },
    body,
  });
  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
