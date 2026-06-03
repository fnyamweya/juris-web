"use client";

import type { ActiveSession } from "@repo/civis";
import { Button } from "@repo/ui";
import { LogOut, Monitor, Smartphone } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { revokeAllOtherSessions, revokeSession } from "../actions";

interface Props {
  locale: string;
  sessions: ActiveSession[];
  /** The ID of the session that made this page request — mark it as "current" */
  currentSessionId?: string;
}

function deviceLabel(session: ActiveSession): string {
  const amr = session.amr ?? [];
  const methods = amr
    .map((m) => {
      if (m === "pwd") return "Password";
      if (m === "totp") return "TOTP";
      if (m === "webauthn") return "Passkey";
      return m;
    })
    .join(" + ");
  const ip = session.clientIp ?? "Unknown IP";
  return `${ip}${methods ? ` · ${methods}` : ""}`;
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function SessionsList({ locale, sessions, currentSessionId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmAll, setConfirmAll] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const hasSessions = sessions.length > 0;
  const otherSessions = sessions.filter((s) => s.id !== currentSessionId);

  function handleRevoke(sessionId: string) {
    setRevokingId(sessionId);
    startTransition(async () => {
      try {
        await revokeSession(locale, sessionId);
        toast.success("Session revoked");
      } catch {
        toast.error("Could not revoke session. Please try again.");
      } finally {
        setRevokingId(null);
      }
    });
  }

  function handleRevokeAll() {
    if (!confirmAll) {
      setConfirmAll(true);
      // Auto-reset confirmation after 4 s
      setTimeout(() => setConfirmAll(false), 4000);
      return;
    }
    setConfirmAll(false);
    startTransition(async () => {
      try {
        const count = await revokeAllOtherSessions(
          locale,
          currentSessionId ?? "",
        );
        toast.success(
          count === 0
            ? "No other sessions to sign out"
            : `Signed out from ${count} other device${count > 1 ? "s" : ""}`,
        );
      } catch {
        toast.error("Could not sign out other sessions. Please try again.");
      }
    });
  }

  if (!hasSessions) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No active sessions found.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {sessions.map((session) => {
          const isCurrent = session.id === currentSessionId;
          const isRevoking = revokingId === session.id;
          return (
            <li
              key={session.id}
              className="flex items-start justify-between rounded-lg border p-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-muted p-1.5 text-muted-foreground">
                  {session.clientIp?.includes(":") ? (
                    <Smartphone className="size-4" />
                  ) : (
                    <Monitor className="size-4" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {deviceLabel(session)}
                    {isCurrent && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.tenantId
                      ? `Tenant: ${session.tenantId}`
                      : "Platform session"}
                    {" · "}
                    Last active {relativeTime(session.lastActivityAt)}
                    {" · "}
                    Expires {session.absoluteExpiresAt
                      ? new Date(session.absoluteExpiresAt).toLocaleDateString()
                      : "—"}
                  </p>
                  {(session.acr ?? session.amr?.length) && (
                    <p className="text-xs text-muted-foreground">
                      ACR: {session.acr ?? "n/a"} · AMR:{" "}
                      {(session.amr ?? []).join(", ") || "pwd"}
                    </p>
                  )}
                </div>
              </div>
              {!isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRevoke(session.id)}
                  disabled={isPending || isRevoking}
                >
                  {isRevoking ? "Signing out…" : "Sign out"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {otherSessions.length > 1 && (
        <div className="flex justify-end pt-2">
          <Button
            variant={confirmAll ? "destructive" : "outline"}
            size="sm"
            onClick={handleRevokeAll}
            disabled={isPending}
            className="gap-1.5"
          >
            <LogOut className="size-3.5" />
            {confirmAll
              ? "Tap again to confirm sign-out everywhere"
              : `Sign out ${otherSessions.length} other sessions`}
          </Button>
        </div>
      )}
    </div>
  );
}
