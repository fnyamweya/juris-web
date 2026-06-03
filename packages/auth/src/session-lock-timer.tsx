import { getEnv } from "@repo/platform";
import { cookies } from "next/headers";
import { readBffSession } from "./bff-session";
import { decodeSessionCookie, SESSION_COOKIE_NAME } from "./session-codec";
import { SessionLockTimerClient } from "./session-lock-timer-client";

type SessionLockTimerProps = {
  locale: string;
};

function maskEmail(email: string | undefined): string | undefined {
  if (!email || !email.includes("@")) return undefined;
  const at = email.indexOf("@");
  const local = email.slice(0, at);
  return (local.length > 0 ? local[0] : "") + "•••••" + email.slice(at);
}

export async function SessionLockTimer({ locale }: SessionLockTimerProps) {
  const cookieValue = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return null;

  const secret = getEnv("SESSION_SECRET");
  if (secret && (await decodeSessionCookie(cookieValue, secret))) {
    return null;
  }

  const session = await readBffSession(cookieValue, false);
  const metadata = session.metadata;
  if (
    session.status !== "ACTIVE" ||
    !metadata?.lastActivityAt ||
    !metadata.idleTimeoutSeconds
  ) {
    return null;
  }

  const email = maskEmail(metadata.email);
  return (
    <SessionLockTimerClient
      locale={locale}
      lastActivityAt={metadata.lastActivityAt}
      idleTimeoutSeconds={metadata.idleTimeoutSeconds}
      warningBeforeTimeoutSeconds={metadata.warningBeforeTimeoutSeconds ?? 120}
      {...(email ? { maskedEmail: email } : {})}
    />
  );
}
