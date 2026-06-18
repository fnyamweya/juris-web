import {
  readBffSession,
  sanitizeReturnTo,
  SESSION_COOKIE_NAME,
} from "@repo/auth";
import { getEnv, requireEnv } from "@repo/platform";
import { NextResponse, type NextRequest } from "next/server";
import {
  APP_FLOW_COOKIE_NAME,
  CIVIS_BFF_NONCE,
  CIVIS_BFF_STATE,
  CIVIS_BFF_VERIFIER,
} from "@/lib/bff-cookies";

const FLOW_COOKIE_MAX_AGE = 900;

type BffLoginData = {
  authorizeUrl: string;
};

function isSecure(request: NextRequest): boolean {
  const env = getEnv("NEXT_PUBLIC_APP_ENV");
  if (env === "production" || env === "staging") return true;
  return request.nextUrl.protocol === "https:";
}

function getSetCookieStrings(headers: Headers): string[] {
  const proto = Object.getPrototypeOf(headers) as Record<string, unknown>;
  if (typeof proto["getSetCookie"] === "function") {
    return (headers as unknown as { getSetCookie(): string[] }).getSetCookie();
  }
  const raw = headers.get("set-cookie") ?? "";
  if (!raw) return [];
  return raw.split(/,(?=\s*[A-Za-z0-9_-]+=)/).map((s) => s.trim());
}

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;
  const locale = searchParams.get("locale") ?? "en";
  const safeReturnTo = sanitizeReturnTo(
    searchParams.get("returnTo"),
    `/${locale}/console`,
  );
  const handle = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const baseUrl = requireEnv("JURIS_BASE_URL");

  if (!handle) {
    return NextResponse.redirect(
      new URL(
        `/${locale}/login?returnTo=${encodeURIComponent(safeReturnTo)}`,
        baseUrl,
      ),
    );
  }

  const session = await readBffSession(handle, false);
  if (session.status === "ACTIVE") {
    return NextResponse.redirect(new URL(safeReturnTo, baseUrl));
  }
  if (session.status !== "LOCKED" || !session.metadata) {
    const response = NextResponse.redirect(
      new URL(
        `/${locale}/login?returnTo=${encodeURIComponent(safeReturnTo)}`,
        baseUrl,
      ),
    );
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  const civisCoreUrl = requireEnv("CIVIS_CORE_URL");
  const redirectUri = `${baseUrl}/oauth/callback`;
  const bffUrl = new URL(`${civisCoreUrl}/v1/ui/login/bff`);
  bffUrl.searchParams.set("redirectUri", redirectUri);
  bffUrl.searchParams.set("prompt", "login");
  bffUrl.searchParams.set("maxAgeSeconds", "0");
  if (session.metadata.activeTenantId) {
    bffUrl.searchParams.set("tenantId", session.metadata.activeTenantId);
  }
  const loginHint = session.metadata.email ?? session.metadata.subject;
  if (loginHint) {
    bffUrl.searchParams.set("loginHint", loginHint);
  }

  const res = await fetch(bffUrl.toString(), {
    method: "POST",
    headers: { Accept: "application/json" },
  }).catch(() => null);

  if (!res?.ok) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=auth_unavailable`, baseUrl),
    );
  }

  const body = (await res.json()) as { data: BffLoginData };
  const response = NextResponse.redirect(new URL(body.data.authorizeUrl));
  const flowCookie = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    maxAge: FLOW_COOKIE_MAX_AGE,
    secure: isSecure(request),
  };

  for (const cookieStr of getSetCookieStrings(res.headers)) {
    const nameValue = cookieStr.split(";")[0]?.trim() ?? "";
    const eqIdx = nameValue.indexOf("=");
    if (eqIdx === -1) continue;
    const name = nameValue.substring(0, eqIdx).trim();
    const value = nameValue.substring(eqIdx + 1).trim();
    if (
      name !== CIVIS_BFF_VERIFIER &&
      name !== CIVIS_BFF_STATE &&
      name !== CIVIS_BFF_NONCE
    ) {
      continue;
    }
    response.cookies.set(name, value, flowCookie);
  }

  response.cookies.set(
    APP_FLOW_COOKIE_NAME,
    JSON.stringify({
      locale,
      returnTo: safeReturnTo,
      flow: "reactivate",
      sessionHandle: handle,
      reauthStartedAt: new Date().toISOString(),
    }),
    flowCookie,
  );

  return response;
}
