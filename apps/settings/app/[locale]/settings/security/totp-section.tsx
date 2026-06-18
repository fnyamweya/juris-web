"use client";

import { Button } from "@repo/ui";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { TotpSetupFlow } from "./totp-setup-flow";
import { useStepUp } from "./use-step-up";

interface TotpStatus {
  enrolled: boolean;
  enrolledAt: string | null;
}

interface Props {
  initial: TotpStatus;
}

export function TotpSection({ initial }: Props) {
  const [status, setStatus] = useState<TotpStatus>(initial);
  const [showSetup, setShowSetup] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { requireStepUp, dialog } = useStepUp();

  function handleSetupClose() {
    setShowSetup(false);
    void fetch("/api/mfa/totp/status")
      .then((r) => r.json())
      .then((data) => setStatus(data as TotpStatus))
      .catch(() => {});
  }

  function handleRemove() {
    if (!confirmRemove) {
      setConfirmRemove(true);
      setTimeout(() => setConfirmRemove(false), 4000);
      return;
    }
    setConfirmRemove(false);
    startTransition(async () => {
      try {
        const res = await requireStepUp(() =>
          fetch("/api/mfa/totp/revoke", { method: "DELETE" }),
        );
        if (!res) return;
        if (!res.ok) {
          toast.error("Could not remove authenticator app. Please try again.");
          return;
        }
        setStatus({ enrolled: false, enrolledAt: null });
        toast.success("Authenticator app removed");
      } catch {
        toast.error("Network error. Please try again.");
      }
    });
  }

  function handleRegenerateCodes() {
    startTransition(async () => {
      try {
        const res = await requireStepUp(() =>
          fetch("/api/mfa/backup-codes/generate", { method: "POST", body: "{}" }),
        );
        if (!res) return;
        if (!res.ok) {
          toast.error("Could not regenerate backup codes. Please try again.");
          return;
        }
        const data = (await res.json()) as { codes: string[] };
        const text = data.codes.join("\n");
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "juris-backup-codes.txt";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("New backup codes generated and downloaded");
      } catch {
        toast.error("Network error. Please try again.");
      }
    });
  }

  if (showSetup) {
    return (
      <>
        {dialog}
        <TotpSetupFlow onClose={handleSetupClose} requireStepUp={requireStepUp} />
      </>
    );
  }

  if (status.enrolled) {
    return (
      <div className="space-y-3">
        {dialog}
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Set up
          </span>
          {status.enrolledAt && (
            <span className="text-xs text-muted-foreground">
              · enrolled {new Date(status.enrolledAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateCodes}
            disabled={isPending}
          >
            Regenerate backup codes
          </Button>
          <Button
            variant={confirmRemove ? "destructive" : "outline"}
            size="sm"
            onClick={handleRemove}
            disabled={isPending}
          >
            {confirmRemove ? "Tap again to confirm removal" : "Remove"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dialog}
      <div className="flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground/40" />
        <span className="text-sm text-muted-foreground">Not set up</span>
      </div>
      <Button size="sm" onClick={() => setShowSetup(true)} disabled={isPending}>
        Set up authenticator app
      </Button>
    </div>
  );
}
