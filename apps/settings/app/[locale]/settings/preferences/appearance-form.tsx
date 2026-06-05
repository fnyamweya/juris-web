"use client";

import type { AppearancePreferences } from "@repo/civis";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@repo/ui";
import { useTransition } from "react";
import { toast } from "sonner";
import { saveAppearance } from "../actions";

interface Props {
  locale: string;
  initial: AppearancePreferences;
}

const THEME_OPTIONS = [
  { value: "system", label: "System default" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

const DENSITY_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
] as const;

const FONT_SIZE_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium (default)" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra large" },
] as const;

export function AppearanceForm({ locale, initial }: Props) {
  const [isPending, startTransition] = useTransition();

  function patch(update: Partial<AppearancePreferences>) {
    startTransition(async () => {
      try {
        await saveAppearance(locale, update);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        toast.success("Appearance saved");
      } catch {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        toast.error("Failed to save. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-0">
      <SettingRow
        label="Theme"
        description="Choose how Juris looks across all your devices."
      >
        <Select
          defaultValue={initial.theme}
          onValueChange={(v) =>
            patch({ theme: v as AppearancePreferences["theme"] })
          }
          disabled={isPending}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEME_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Information density"
        description="How compact or spread-out tables and lists appear."
      >
        <Select
          defaultValue={initial.density}
          onValueChange={(v) =>
            patch({ density: v as AppearancePreferences["density"] })
          }
          disabled={isPending}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DENSITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Font size"
        description="Base text size throughout the application."
      >
        <Select
          defaultValue={initial.fontSize}
          onValueChange={(v) =>
            patch({ fontSize: v as AppearancePreferences["fontSize"] })
          }
          disabled={isPending}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Reduce motion"
        description="Minimise animations and transitions."
      >
        <Switch
          checked={initial.reduceMotion}
          onCheckedChange={(v) => patch({ reduceMotion: v })}
          disabled={isPending}
          aria-label="Reduce motion"
        />
      </SettingRow>

      <SettingRow
        label="High contrast"
        description="Increase colour contrast for better readability."
      >
        <Switch
          checked={initial.highContrast}
          onCheckedChange={(v) => patch({ highContrast: v })}
          disabled={isPending}
          aria-label="High contrast"
        />
      </SettingRow>
    </div>
  );
}

export function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b py-4 last:border-0">
      <div className="space-y-0.5 pr-6">
        <Label className="cursor-default text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
