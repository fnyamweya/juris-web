import { getEnv } from "@repo/platform";

export async function DELETE(request: Request) {
  const casUrl = getEnv("CAS_ISSUER_URL") ?? "http://localhost:9000";
  const cookies = request.headers.get("cookie") ?? "";
  const res = await fetch(`${casUrl}/mfa/totp`, {
    method: "DELETE",
    headers: { cookie: cookies },
  });
  return new Response(null, { status: res.status });
}
