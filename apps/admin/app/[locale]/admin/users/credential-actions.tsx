"use client";

import type { PasswordResetIssued } from "@repo/civis";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@repo/ui";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resetPlatformUserPassword } from "./actions";

function maskLink(link: string) {
  if (link.length <= 24) return "•".repeat(link.length);
  return `${link.slice(0, 16)}${"•".repeat(24)}${link.slice(-8)}`;
}

function CredentialResultDialog({
  result,
  onClose,
}: {
  result: PasswordResetIssued | null;
  onClose: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  function copy(link: string) {
    void navigator.clipboard.writeText(link).then(() => {
      toast.success("Link copied to clipboard");
    });
  }

  return (
    <Dialog
      open={result !== null}
      onOpenChange={(open) => {
        if (!open) {
          setRevealed(false);
          onClose();
        }
      }}
    >
      {result ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>One-time link issued</DialogTitle>
            <DialogDescription>
              This link is shown only once. Copy it now and share it securely —
              it won&apos;t be shown again.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="warning">
            <AlertTitle>Action required</AlertTitle>
            <AlertDescription>
              {result.warning ??
                "Platform-level resets are never emailed — share this link securely."}
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label>One-time link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={revealed ? result.link : maskLink(result.link)}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setRevealed((v) => !v)}
              >
                {revealed ? "Hide" : "Reveal"}
              </Button>
              <Button type="button" onClick={() => copy(result.link)}>
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Expires {new Date(result.expiresAt).toLocaleString()}
            </p>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

export function ResetPlatformUserPasswordButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PasswordResetIssued | null>(null);

  function handleClick() {
    startTransition(async () => {
      try {
        const issued = await resetPlatformUserPassword(userId);
        setResult(issued);
      } catch {
        toast.error("Could not issue a password reset link.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
      >
        Reset password
      </Button>
      <CredentialResultDialog result={result} onClose={() => setResult(null)} />
    </>
  );
}
