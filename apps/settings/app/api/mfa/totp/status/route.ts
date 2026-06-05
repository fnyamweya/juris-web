import { getEnv } from "@repo/platform";

export async function GET(request: Request) {
  const casUrl = getEnv("CAS_ISSUER_URL") ?? "http://localhost:9000";
  const cookies = request.headers.get("cookie") ?? "";
  const res = await fetch(`${casUrl}/mfa/totp/status`, {
    method: "GET",
    headers: { cookie: cookies },
  });
  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
