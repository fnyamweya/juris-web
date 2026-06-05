import { getEnv } from "@repo/platform";

export async function POST(request: Request) {
  const casUrl = getEnv("CAS_ISSUER_URL") ?? "http://localhost:9000";
  const cookies = request.headers.get("cookie") ?? "";
  const body = await request.text();
  const res = await fetch(`${casUrl}/mfa/totp/enroll/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: cookies },
    body,
  });
  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
