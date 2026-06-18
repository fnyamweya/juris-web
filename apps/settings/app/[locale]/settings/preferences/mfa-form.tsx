"use client";

import type { MfaPreferences } from "@repo/civis";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveMfaPreferences } from "../actions";
import { SettingRow } from "./appearance-form";

interface Props {
  locale: string;
  initial: MfaPreferences;
}

const MFA_METHODS = [
  { value: "__none__", label: "No preference — use any available" },
  { value: "totp", label: "Authenticator app (TOTP)" },
  { value: "webauthn", label: "Passkey or security key (WebAuthn)" },
] as const;

const TRUST_PRESETS = [
  { value: "0", label: "Never trust this device" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
] as const;

export function MfaForm({ locale, initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [customDays, setCustomDays] = useState<string>("");

  const currentMethodValue = initial.preferredMethod ?? "__none__";
  const currentDaysPreset = TRUST_PRESETS.find(
    (p) => p.value === String(initial.rememberDeviceDays),
  )
    ? String(initial.rememberDeviceDays)
    : "custom";

  function patchMethod(v: string) {
    const preferredMethod =
      v === "__none__" ? null : (v as MfaPreferences["preferredMethod"]);
    startTransition(async () => {
      try {
        await saveMfaPreferences(locale, { preferredMethod });
        toast.success("MFA preference saved");
      } catch {
        toast.error("Failed to save. Please try again.");
      }
    });
  }

  function patchDays(days: number) {
    startTransition(async () => {
      try {
        await saveMfaPreferences(locale, { rememberDeviceDays: days });
        toast.success(
          days === 0
            ? "Devices will never be trusted"
            : `Devices trusted for ${days} days after MFA`,
        );
      } catch {
        toast.error("Failed to save. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-0">
      <SettingRow
        label="Preferred MFA method"
        description="When multiple methods are available, this one is shown first at sign-in."
      >
        <Select
          defaultValue={currentMethodValue}
          onValueChange={patchMethod}
          disabled={isPending}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MFA_METHODS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Trust this device after MFA"
        description="Skip MFA on this device for the selected period. Set to 0 to always require MFA."
      >
        <div className="flex items-center gap-2">
          <Select
            defaultValue={currentDaysPreset}
            onValueChange={(v) => {
              if (v === "custom") return;
              patchDays(Number(v));
            }}
            disabled={isPending}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRUST_PRESETS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom…</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SettingRow>

      {currentDaysPreset === "custom" && (
        <div className="flex items-end gap-3 pb-4 pl-0">
          <div className="space-y-1.5">
            <Label htmlFor="custom-days" className="text-xs text-muted-foreground">
              Custom number of days
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="custom-days"
                type="number"
                min={0}
                max={365}
                className="w-24"
                placeholder="0"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => {
                  const days = Math.max(0, Math.min(365, Number(customDays)));
                  if (!Number.isNaN(days)) patchDays(days);
                }}
                disabled={isPending || !customDays}
                className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
