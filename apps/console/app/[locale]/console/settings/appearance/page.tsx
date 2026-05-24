import type { Locale } from "@repo/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { Settings2 } from "lucide-react";
import { ConsolePageShell } from "@/components/console-page-shell";

export default async function ConsoleAppearanceSettingsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <ConsolePageShell
      locale={locale}
      breadcrumbLabel="Appearance"
      title="Appearance"
      description="Configure per-app themes, colors, and typography for your console workspace."
    >
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Theme controls
          </CardTitle>
          <CardDescription>
            Use the Theme Settings panel in the top bar to adjust preset theme,
            accent color, and app font. These preferences are persisted per app.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tenant owners can define a default font for this console independently
          from other apps. Non-public apps default to Outfit.
        </CardContent>
      </Card>
    </ConsolePageShell>
  );
}
