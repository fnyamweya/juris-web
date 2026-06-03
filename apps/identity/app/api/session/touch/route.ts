import { ensureBffSession, SESSION_COOKIE_NAME } from "@repo/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const NO_CACHE = "no-store, no-cache, must-revalidate, private";

/**
 * Touches the BFF session to reset the idle timeout clock.
 * Called by the client timer when user activity is detected on a page where
 * no navigation (and therefore no middleware touch) has occurred recently.
 * Returns the updated lastActivityAt so the client can reschedule its timer.
 */
export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const handle = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!handle) {
    return NextResponse.json(
      { ok: false, reason: "no_session" },
      { status: 401, headers: { "Cache-Control": NO_CACHE } },
    );
  }

  const session = await ensureBffSession(handle, {
    touch: true,
    refreshThresholdSeconds: 60,
  });

  const active = session.status === "ACTIVE";
  return NextResponse.json(
    {
      ok: active,
      status: session.status,
      lastActivityAt: session.metadata?.lastActivityAt ?? null,
      idleTimeoutSeconds: session.metadata?.idleTimeoutSeconds ?? null,
      warningBeforeTimeoutSeconds: session.metadata?.warningBeforeTimeoutSeconds ?? 120,
    },
    {
      status: active ? 200 : 401,
      headers: { "Cache-Control": NO_CACHE },
    },
  );
}
