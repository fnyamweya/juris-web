import { fetchCasCsrfHeaders } from "@repo/auth";
import { getEnv } from "@repo/platform";
export async function POST(request: Request) {
  const casUrl = getEnv("CAS_ISSUER_URL") ?? "http://localhost:9000";
  const cookies = request.headers.get("cookie") ?? "";
  const body = await request.text();
  const csrfHeaders = await fetchCasCsrfHeaders(casUrl, cookies);
  if (!csrfHeaders) {
    return new Response(null, { status: 401 });
  }
  const res = await fetch(`${casUrl}/mfa/backup-codes/generate`, {
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
