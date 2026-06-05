"use client";

import type { MarketingPreferences, PrivacyPreferences } from "@repo/civis";
import { Switch } from "@repo/ui";
import { useTransition } from "react";
import { toast } from "sonner";
import { saveMarketing, savePrivacy } from "../actions";

// ── Marketing form ────────────────────────────────────────────────────────────

interface MarketingProps {
  locale: string;
  initial: MarketingPreferences;
}

export function MarketingForm({ locale, initial }: MarketingProps) {
  const [isPending, startTransition] = useTransition();

  function patch(update: Partial<MarketingPreferences>) {
    startTransition(async () => {
      try {
        await saveMarketing(locale, { ...initial, ...update });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        toast.success("Communication preferences saved");
      } catch {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        toast.error("Failed to save. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-0 rounded-lg border">
      <ConsentRow
        label="Product updates & news"
        description="Release notes, feature announcements, and platform changes."
        checked={initial.productUpdates}
        onCheckedChange={(v) => patch({ productUpdates: v })}
        disabled={isPending}
      />
      <ConsentRow
        label="Email marketing"
        description="Occasional promotional campaigns and offers from Juris."
        checked={initial.emailMarketing}
        onCheckedChange={(v) => patch({ emailMarketing: v })}
        disabled={isPending}
      />
      <ConsentRow
        label="Research invitations"
        description="Invitations to participate in user research sessions and surveys."
        checked={initial.researchInvitations}
        onCheckedChange={(v) => patch({ researchInvitations: v })}
        disabled={isPending}
      />
      <ConsentRow
        label="Partner offers"
        description="Special offers from our trusted integration and technology partners."
        checked={initial.partnerOffers}
        onCheckedChange={(v) => patch({ partnerOffers: v })}
        disabled={isPending}
      />
    </div>
  );
}

// ── Privacy / telemetry form ──────────────────────────────────────────────────

interface PrivacyProps {
  locale: string;
  initial: PrivacyPreferences;
}

export function PrivacyForm({ locale, initial }: PrivacyProps) {
  const [isPending, startTransition] = useTransition();

  function patch(update: Partial<PrivacyPreferences>) {
    startTransition(async () => {
      try {
        await savePrivacy(locale, { ...initial, ...update });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        toast.success("Privacy settings saved");
      } catch {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        toast.error("Failed to save. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-0 rounded-lg border">
      <ConsentRow
        label="Analytics"
        description="Usage data to understand how features are used and improve the platform."
        checked={initial.analytics}
        onCheckedChange={(v) => patch({ analytics: v })}
        disabled={isPending}
      />
      <ConsentRow
        label="Crash reporting"
        description="Automatic error reports to help us diagnose and fix bugs faster."
        checked={initial.crashReporting}
        onCheckedChange={(v) => patch({ crashReporting: v })}
        disabled={isPending}
      />
      <ConsentRow
        label="Performance monitoring"
        description="Page load times and API latency data to improve the experience."
        checked={initial.performanceMonitoring}
        onCheckedChange={(v) => patch({ performanceMonitoring: v })}
        disabled={isPending}
      />
      <ConsentRow
        label="Personalisation"
        description="Use your activity to personalise the interface and recommendations."
        checked={initial.personalization}
        onCheckedChange={(v) => patch({ personalization: v })}
        disabled={isPending}
      />
    </div>
  );
}

// ── Shared row component ──────────────────────────────────────────────────────

function ConsentRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between px-4 py-4 [&:not(:last-child)]:border-b">
      <div className="space-y-0.5 pr-6">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
        className="mt-0.5 shrink-0"
      />
    </div>
  );
}
