"use client";

import type { InviteMemberRequest, PasswordResetIssued } from "@repo/civis";
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
import {
  inviteTenantMember,
  resendTenantMemberInvite,
  resetTenantMemberPassword,
} from "../../server-actions";

const inputClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

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
          {result.warning ? (
            <Alert variant="warning">
              <AlertTitle>Action required</AlertTitle>
              <AlertDescription>{result.warning}</AlertDescription>
            </Alert>
          ) : (
            <Alert variant="success">
              <AlertTitle>Email sent</AlertTitle>
              <AlertDescription>
                This link was also emailed to the user.
              </AlertDescription>
            </Alert>
          )}
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

export function ResetMemberPasswordButton({
  tenantId,
  userId,
}: {
  tenantId: string;
  userId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PasswordResetIssued | null>(null);

  function handleClick() {
    startTransition(async () => {
      try {
        const issued = await resetTenantMemberPassword(tenantId, userId);
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

export function ResendInviteButton({
  tenantId,
  userId,
}: {
  tenantId: string;
  userId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PasswordResetIssued | null>(null);

  function handleClick() {
    startTransition(async () => {
      try {
        const issued = await resendTenantMemberInvite(tenantId, userId);
        setResult(issued);
      } catch {
        toast.error("Could not resend the invite.");
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
        Resend invite
      </Button>
      <CredentialResultDialog result={result} onClose={() => setResult(null)} />
    </>
  );
}

export function InviteMemberForm({
  tenantId,
  locale,
}: {
  tenantId: string;
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PasswordResetIssued | null>(null);

  function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const displayName = String(formData.get("displayName") ?? "").trim();
    const roles = String(formData.get("roles") ?? "")
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);

    if (!email) {
      toast.error("Email is required");
      return;
    }

    const payload: InviteMemberRequest = {
      email,
      displayName: displayName || email,
      ...(roles.length ? { roles } : {}),
    };

    startTransition(async () => {
      try {
        const issued = await inviteTenantMember(tenantId, payload, locale);
        setResult(issued);
      } catch {
        toast.error("Could not invite this member.");
      }
    });
  }

  return (
    <>
      <form action={handleSubmit} className="grid gap-3 md:grid-cols-4">
        <input className={inputClass} name="email" type="email" placeholder="Email" required />
        <input className={inputClass} name="displayName" placeholder="Display name" />
        <input className={inputClass} name="roles" defaultValue="TENANT_MEMBER" />
        <Button type="submit" disabled={isPending}>
          Invite
        </Button>
      </form>
      <CredentialResultDialog result={result} onClose={() => setResult(null)} />
    </>
  );
}
