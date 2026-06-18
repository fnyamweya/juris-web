"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@repo/ui";
import { useState } from "react";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReauthenticateDialog({ onSuccess, onCancel }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/reauthenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setError(data?.error?.message ?? "That password is incorrect.");
        return;
      }
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm your password</DialogTitle>
          <DialogDescription>
            For your security, please re-enter your password to continue.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="reauth-password">Password</Label>
          <Input
            id="reauth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSubmit();
            }}
            disabled={loading}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !password}>
            {loading ? "Confirming…" : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
