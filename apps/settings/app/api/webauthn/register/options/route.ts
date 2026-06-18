import { fetchCasCsrfHeaders } from "@repo/auth";
import { getEnv } from "@repo/platform";

// Proxies the start of a WebAuthn passkey registration ceremony to CAS's native WebAuthn endpoint,
// forwarding the user's CAS session cookie + CSRF token. Returns the PublicKeyCredentialCreationOptions
// the browser passes to navigator.credentials.create().
export async function POST(request: Request) {
  const casUrl = getEnv("CAS_ISSUER_URL") ?? "http://localhost:9000";
  const cookies = request.headers.get("cookie") ?? "";
  const csrfHeaders = await fetchCasCsrfHeaders(casUrl, cookies);
  if (!csrfHeaders) {
    return new Response(null, { status: 401 });
  }
  const res = await fetch(`${casUrl}/webauthn/register/options`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrfHeaders },
  });
  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
