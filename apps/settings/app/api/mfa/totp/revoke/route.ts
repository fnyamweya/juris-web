import { fetchCasCsrfHeaders } from "@repo/auth";
import { getEnv } from "@repo/platform";

export async function DELETE(request: Request) {
  const casUrl = getEnv("CAS_ISSUER_URL") ?? "http://localhost:9000";
  const cookies = request.headers.get("cookie") ?? "";
  const csrfHeaders = await fetchCasCsrfHeaders(casUrl, cookies);
  if (!csrfHeaders) {
    return new Response(null, { status: 401 });
  }
  const res = await fetch(`${casUrl}/mfa/totp`, {
    method: "DELETE",
    headers: csrfHeaders,
  });
  const data = await res.text();
  return new Response(data || null, {
    status: res.status,
    headers: data ? { "Content-Type": "application/json" } : {},
  });
}
