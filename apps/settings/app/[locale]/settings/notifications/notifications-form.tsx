"use client";

import type { NotificationPreferences } from "@repo/civis";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@repo/ui/theme";
import { useTransition } from "react";
import { toast } from "sonner";
import { saveNotifications } from "../actions";

interface Props {
  locale: string;
  tenantId: string;
  initial: NotificationPreferences;
}

const FREQUENCIES = [
  { value: "instant", label: "Instant — send as events happen" },
  { value: "hourly", label: "Hourly digest" },
  { value: "daily", label: "Daily digest" },
  { value: "weekly", label: "Weekly digest" },
  { value: "none", label: "Off — no digest" },
] as const;

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${String(i).padStart(2, "0")}:00 UTC`,
}));

export function NotificationsForm({ locale, tenantId, initial }: Props) {
  const [isPending, startTransition] = useTransition();

  function patch(update: Partial<NotificationPreferences>) {
    startTransition(async () => {
      try {
        await saveNotifications(locale, tenantId, update);
        toast.success("Notification preferences saved");
      } catch {
        toast.error("Failed to save. Please try again.");
      }
    });
  }

  const channels = initial.channels;
  const digest = initial.digest;
  const categories = initial.categories;

  return (
    <div className="space-y-8">
      {/* Delivery channels */}
      <section>
        <SectionHeading title="Delivery channels" />
        <div className="mt-3 space-y-0 rounded-lg border">
          <ToggleRow
            label="Email"
            description="Receive notifications at your registered email address."
            checked={channels.email}
            onCheckedChange={(v) =>
              patch({ channels: { ...channels, email: v } })
            }
            disabled={isPending}
          />
          <ToggleRow
            label="SMS"
            description="Text messages to your verified phone number."
            checked={channels.sms}
            onCheckedChange={(v) =>
              patch({ channels: { ...channels, sms: v } })
            }
            disabled={isPending}
          />
          <ToggleRow
            label="Push notifications"
            description="Browser and mobile push notifications."
            checked={channels.push}
            onCheckedChange={(v) =>
              patch({ channels: { ...channels, push: v } })
            }
            disabled={isPending}
          />
          <ToggleRow
            label="WhatsApp"
            description="Messages via WhatsApp Business."
            checked={channels.whatsapp}
            onCheckedChange={(v) =>
              patch({ channels: { ...channels, whatsapp: v } })
            }
            disabled={isPending}
          />
        </div>
      </section>

      {/* Digest schedule */}
      <section>
        <SectionHeading
          title="Digest schedule"
          description="Bundle non-urgent notifications into a single message."
        />
        <div className="mt-3 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Frequency</Label>
            <Select
              defaultValue={digest.frequency}
              onValueChange={(v) =>
                patch({
                  digest: {
                    ...digest,
                    frequency: v as NotificationPreferences["digest"]["frequency"],
                  },
                })
              }
              disabled={isPending}
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {digest.frequency !== "instant" && digest.frequency !== "none" && (
            <div className="flex items-center justify-between">
              <Label className="text-sm">Send at (UTC)</Label>
              <Select
                defaultValue={String(digest.hourUtc)}
                onValueChange={(v) =>
                  patch({ digest: { ...digest, hourUtc: Number(v) } })
                }
                disabled={isPending}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section>
        <SectionHeading
          title="Notification categories"
          description="Choose which types of events trigger notifications for you."
        />
        <div className="mt-3 space-y-0 rounded-lg border">
          <ToggleRow
            label="Security alerts"
            description="Sign-in from new device, password changed, MFA events."
            checked={categories.securityAlerts}
            onCheckedChange={(v) =>
              patch({ categories: { ...categories, securityAlerts: v } })
            }
            disabled={isPending}
          />
          <ToggleRow
            label="Member events"
            description="New members joining, role changes, membership requests."
            checked={categories.memberEvents}
            onCheckedChange={(v) =>
              patch({ categories: { ...categories, memberEvents: v } })
            }
            disabled={isPending}
          />
          <ToggleRow
            label="Billing events"
            description="Invoices, payment confirmations, subscription changes."
            checked={categories.billingEvents}
            onCheckedChange={(v) =>
              patch({ categories: { ...categories, billingEvents: v } })
            }
            disabled={isPending}
          />
          <ToggleRow
            label="System announcements"
            description="Maintenance windows, feature releases, and platform updates."
            checked={categories.systemAnnouncements}
            onCheckedChange={(v) =>
              patch({ categories: { ...categories, systemAnnouncements: v } })
            }
            disabled={isPending}
          />
          <ToggleRow
            label="Custom events"
            description="Application-specific events defined by your organisation."
            checked={categories.customEvents}
            onCheckedChange={(v) =>
              patch({ categories: { ...categories, customEvents: v } })
            }
            disabled={isPending}
          />
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 [&:not(:last-child)]:border-b">
      <div className="space-y-0.5 pr-6">
        <Label className="cursor-pointer text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}
