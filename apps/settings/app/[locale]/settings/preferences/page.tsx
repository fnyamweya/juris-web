import type { Locale } from "@repo/i18n";
import { requirePermission } from "@repo/auth";
import { CivisApiError, createCivisClient } from "@repo/civis";
import type { UserPreferences } from "@repo/civis";
import {
  AppShell,
  Badge,
  Breadcrumb,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from "@repo/ui";
import { getSettingsBreadcrumb, getSettingsNavItems } from "@/lib/navigation";

async function fetchPreferences(): Promise<UserPreferences | null> {
  try {
    const client = await createCivisClient();
    return await client.me.preferences.get();
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return null;
  }
}

export default async function SettingsPreferencesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await requirePermission("settings:read", {
    redirectTo: `/${locale}/console`,
  });
  const prefs = await fetchPreferences();
  const appearance = prefs?.appearance;
  const loc = prefs?.locale;
  const mfa = prefs?.mfa;

  return (
    <AppShell
      appName="Settings"
      navItems={getSettingsNavItems(locale)}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      logoutUrl={`/api/auth/logout?locale=${locale}`}
      breadcrumb={<Breadcrumb items={getSettingsBreadcrumb(locale, "Preferences")} />}
    >
      <PageHeader
        title="Preferences"
        description="Appearance, language, regional formatting, and authentication preferences."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Theme, density, and accessibility.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Theme" value={appearance?.theme ?? "system"} />
            <Row label="Density" value={appearance?.density ?? "comfortable"} />
            <Row label="Font size" value={appearance?.fontSize ?? "md"} />
            <Row
              label="Reduce motion"
              value={appearance?.reduceMotion ? "On" : "Off"}
            />
            <Row
              label="High contrast"
              value={appearance?.highContrast ? "On" : "Off"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Language & Region</CardTitle>
            <CardDescription>Language, timezone, and formatting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Language" value={loc?.language ?? "en"} />
            <Row label="Timezone" value={loc?.timezone ?? "UTC"} />
            <Row label="Date format" value={loc?.dateFormat ?? "DD/MM/YYYY"} />
            <Row
              label="Numbers"
              value={
                loc?.numberFormat === "eu"
                  ? "European (1.234,56)"
                  : "US (1,234.56)"
              }
            />
            <Row label="Currency" value={loc?.currency ?? "USD"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              MFA method preference and device trust policy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row
              label="Preferred MFA"
              value={
                mfa?.preferredMethod === "totp"
                  ? "Authenticator app (TOTP)"
                  : mfa?.preferredMethod === "webauthn"
                    ? "Passkey / security key"
                    : "No preference"
              }
            />
            <Row
              label="Remember device"
              value={
                !mfa?.rememberDeviceDays
                  ? "Never"
                  : mfa.rememberDeviceDays === 1
                    ? "1 day"
                    : `${mfa.rememberDeviceDays} days`
              }
            />
          </CardContent>
        </Card>

        {prefs?.updatedAt && (
          <Card>
            <CardHeader>
              <CardTitle>Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <Row
                label="Last saved"
                value={new Date(prefs.updatedAt).toLocaleString(
                  loc?.language ?? "en",
                )}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant="outline" className="font-mono text-xs">
        {value}
      </Badge>
    </div>
  );
}
