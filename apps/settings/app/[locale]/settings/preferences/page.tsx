import type { Locale } from "@repo/i18n";
import { requirePermission } from "@repo/auth";
import { CivisApiError, createCivisClient } from "@repo/civis";
import type { UserPreferences } from "@repo/civis";
import {
  AppShell,
  Breadcrumb,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from "@repo/ui";
import { getSettingsBreadcrumb, getSettingsNavItems } from "@/lib/navigation";
import { AppearanceForm } from "./appearance-form";
import { LocaleForm } from "./locale-form";
import { MfaForm } from "./mfa-form";

async function fetchPreferences(): Promise<UserPreferences | null> {
  try {
    const client = await createCivisClient();
    return await client.me.preferences.get();
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return null;
  }
}

// Typed defaults so the forms always receive a complete object
const DEFAULTS: UserPreferences = {
  appearance: {
    theme: "system",
    density: "comfortable",
    fontSize: "md",
    reduceMotion: false,
    highContrast: false,
  },
  locale: {
    language: "en",
    timezone: "UTC",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "us",
    currency: "USD",
  },
  marketing: {
    emailMarketing: false,
    productUpdates: true,
    researchInvitations: false,
    partnerOffers: false,
  },
  privacy: {
    analytics: true,
    crashReporting: true,
    performanceMonitoring: true,
    personalization: true,
  },
  mfa: {
    preferredMethod: null,
    rememberDeviceDays: 0,
  },
  updatedAt: null,
};

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
  const merged = { ...DEFAULTS, ...prefs };

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
        description="Personalise your experience. Changes save automatically."
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Theme, information density, and accessibility options.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppearanceForm locale={locale} initial={merged.appearance} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Language & Region</CardTitle>
            <CardDescription>
              Language, timezone, date format, and currency display.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LocaleForm locale={locale} initial={merged.locale} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication preferences</CardTitle>
            <CardDescription>
              Your preferred MFA method and trusted-device policy. This does
              not affect your organisation's MFA requirements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MfaForm locale={locale} initial={merged.mfa} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
