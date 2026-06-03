"use client";

import type { TrustedDevice } from "@repo/civis";
import { Button, Input } from "@repo/ui";
import { Laptop, Pencil, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { renameTrustedDevice, revokeTrustedDevice } from "../actions";

interface Props {
  locale: string;
  devices: TrustedDevice[];
}

function daysUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const d = Math.ceil(diff / 86_400_000);
  if (d <= 0) return "Expired";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}

export function TrustedDevicesList({ locale, devices }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  function startEdit(device: TrustedDevice) {
    setEditingId(device.id);
    setEditLabel(device.label);
    setConfirmRevokeId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLabel("");
  }

  function handleRename(deviceId: string) {
    const label = editLabel.trim();
    if (!label) return;
    startTransition(async () => {
      try {
        await renameTrustedDevice(locale, deviceId, label);
        toast.success("Device renamed");
        setEditingId(null);
        setEditLabel("");
      } catch {
        toast.error("Could not rename device. Please try again.");
      }
    });
  }

  function handleRevoke(deviceId: string) {
    if (confirmRevokeId !== deviceId) {
      setConfirmRevokeId(deviceId);
      setEditingId(null);
      // Auto-reset confirmation after 4 s
      setTimeout(() => setConfirmRevokeId(null), 4000);
      return;
    }
    setConfirmRevokeId(null);
    startTransition(async () => {
      try {
        await revokeTrustedDevice(locale, deviceId);
        toast.success("Device trust removed");
      } catch {
        toast.error("Could not remove trust. Please try again.");
      }
    });
  }

  if (devices.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No trusted devices registered. Enable device trust in{" "}
        <a href="../preferences" className="underline underline-offset-2">
          Preferences
        </a>
        .
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {devices.map((device) => {
        const isEditing = editingId === device.id;
        const isConfirmingRevoke = confirmRevokeId === device.id;

        return (
          <li key={device.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 shrink-0 rounded-md bg-muted p-1.5 text-muted-foreground">
                  <Laptop className="size-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(device.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="h-7 w-48 px-2 py-1 text-sm"
                        autoFocus
                        maxLength={200}
                        disabled={isPending}
                      />
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleRename(device.id)}
                        disabled={isPending || !editLabel.trim()}
                        className="h-7 px-2 text-xs"
                      >
                        Save
                      </Button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="truncate text-sm font-medium">{device.label}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Trusted{" "}
                    {new Date(device.trustedAt).toLocaleDateString()}
                    {" · "}
                    {daysUntil(device.expiresAt)}
                    {device.lastSeenAt && (
                      <>
                        {" · "}Last seen{" "}
                        {new Date(device.lastSeenAt).toLocaleDateString()}
                      </>
                    )}
                    {device.lastIp && ` · ${device.lastIp}`}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {!isEditing && !isConfirmingRevoke && (
                  <button
                    type="button"
                    onClick={() => startEdit(device)}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Rename"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    isConfirmingRevoke
                      ? "border-destructive text-destructive hover:bg-destructive/10"
                      : "text-muted-foreground hover:text-destructive"
                  }
                  onClick={() => handleRevoke(device.id)}
                  disabled={isPending}
                >
                  {isConfirmingRevoke ? (
                    "Confirm remove"
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
