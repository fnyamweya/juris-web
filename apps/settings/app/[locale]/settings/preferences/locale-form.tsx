"use client";

import type { LocalePreferences } from "@repo/civis";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { useTransition } from "react";
import { toast } from "sonner";
import { saveLocale } from "../actions";
import { SettingRow } from "./appearance-form";

interface Props {
  locale: string;
  initial: LocalePreferences;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "sw", label: "Swahili" },
  { value: "fr", label: "French" },
  { value: "ar", label: "Arabic" },
  { value: "pt", label: "Portuguese" },
  { value: "es", label: "Spanish" },
  { value: "zh", label: "Chinese (Simplified)" },
] as const;

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT +3)" },
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT +1)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST +2)" },
  { value: "Africa/Cairo", label: "Africa/Cairo (EET +2)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST +1)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST +1)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT -5)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT -8)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST +4)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT +8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST +9)" },
] as const;

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY  (31/01/2025)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY  (01/31/2025)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD  (2025-01-31)" },
] as const;

const NUMBER_FORMATS = [
  { value: "us", label: "US  (1,234.56)" },
  { value: "eu", label: "European  (1.234,56)" },
] as const;

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
  { value: "EGP", label: "EGP — Egyptian Pound" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "INR", label: "INR — Indian Rupee" },
] as const;

export function LocaleForm({ locale, initial }: Props) {
  const [isPending, startTransition] = useTransition();

  function patch(update: Partial<LocalePreferences>) {
    startTransition(async () => {
      try {
        await saveLocale(locale, update);
        toast.success("Language & region saved");
      } catch {
        toast.error("Failed to save. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-0">
      <SettingRow label="Language" description="Interface language for all Juris applications.">
        <Select
          defaultValue={initial.language}
          onValueChange={(v) => patch({ language: v })}
          disabled={isPending}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Timezone" description="Timestamps and scheduled events will use this timezone.">
        <Select
          defaultValue={initial.timezone}
          onValueChange={(v) => patch({ timezone: v })}
          disabled={isPending}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Date format" description="How dates are displayed throughout the platform.">
        <Select
          defaultValue={initial.dateFormat}
          onValueChange={(v) =>
            patch({ dateFormat: v as LocalePreferences["dateFormat"] })
          }
          disabled={isPending}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_FORMATS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Number format" description="How numbers and decimal separators are displayed.">
        <Select
          defaultValue={initial.numberFormat}
          onValueChange={(v) =>
            patch({ numberFormat: v as LocalePreferences["numberFormat"] })
          }
          disabled={isPending}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NUMBER_FORMATS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow label="Currency" description="Default currency for billing and financial displays.">
        <Select
          defaultValue={initial.currency}
          onValueChange={(v) => patch({ currency: v })}
          disabled={isPending}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  );
}
