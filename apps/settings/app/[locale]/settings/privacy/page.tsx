import type { Locale } from "@repo/i18n";
import { requirePermission } from "@repo/auth";
import { CivisApiError, createCivisClient } from "@repo/civis";
import type { MarketingPreferences, PrivacyPreferences, TermsStatus } from "@repo/civis";
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
import { CheckCircle2, FileText } from "lucide-react";
import { getSettingsBreadcrumb, getSettingsNavItems } from "@/lib/navigation";
import { MarketingForm, PrivacyForm } from "./privacy-form";

const DEFAULT_MARKETING: MarketingPreferences = {
  emailMarketing: false,
  productUpdates: true,
  researchInvitations: false,
  partnerOffers: false,
};

const DEFAULT_PRIVACY: PrivacyPreferences = {
  analytics: true,
  crashReporting: true,
  performanceMonitoring: true,
  personalization: true,
};

async function fetchPrivacyData(): Promise<{
  marketing: MarketingPreferences;
  privacy: PrivacyPreferences;
  terms: TermsStatus | null;
}> {
  try {
    const client = await createCivisClient();
    const [prefs, terms] = await Promise.all([
      client.me.preferences.get(),
      client.me.terms.get().catch(() => null),
    ]);
    return {
      marketing: prefs.marketing ?? DEFAULT_MARKETING,
      privacy: prefs.privacy ?? DEFAULT_PRIVACY,
      terms,
    };
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return { marketing: DEFAULT_MARKETING, privacy: DEFAULT_PRIVACY, terms: null };
  }
}

export default async function SettingsPrivacyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await requirePermission("settings:read", {
    redirectTo: `/${locale}/console`,
  });
  const { marketing, privacy, terms } = await fetchPrivacyData();

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
      breadcrumb={<Breadcrumb items={getSettingsBreadcrumb(locale, "Privacy")} />}
    >
      <PageHeader
        title="Privacy & Consent"
        description="Manage your communication preferences, data sharing settings, and Terms & Conditions history. Changes save automatically."
      />

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Marketing communications */}
        <Card>
          <CardHeader>
            <CardTitle>Communications</CardTitle>
            <CardDescription>
              Control which emails and updates you receive from Juris. You will
              always receive transactional messages related to your account and
              security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MarketingForm locale={locale} initial={marketing} />
          </CardContent>
        </Card>

        {/* Privacy & telemetry */}
        <Card>
          <CardHeader>
            <CardTitle>Data & privacy</CardTitle>
            <CardDescription>
              Choose what usage data is shared to improve the platform. All
              data is anonymised before collection and never sold to third
              parties.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PrivacyForm locale={locale} initial={privacy} />
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <CardTitle>Terms & Conditions</CardTitle>
            </div>
            <CardDescription>
              Your complete T&amp;C acceptance history. Each acceptance is
              recorded with a timestamp, IP address, and language for legal
              compliance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {terms?.latest ? (
              <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Terms accepted — version{" "}
                    <span className="font-mono">{terms.latest.termsVersion}</span>
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {new Date(terms.latest.acceptedAt).toLocaleString()} ·{" "}
                    {terms.latest.channel}
                    {terms.latest.locale && ` · ${terms.latest.locale}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  No Terms & Conditions acceptance on record.
                </p>
                <p className="mt-0.5 text-xs text-orange-600 dark:text-orange-400">
                  You will be prompted to accept the Terms & Conditions on next
                  sign-in if they have not been accepted.
                </p>
              </div>
            )}

            {(terms?.history?.length ?? 0) > 1 && (
              <details className="group">
                <summary className="cursor-pointer list-none text-xs text-muted-foreground hover:text-foreground">
                  <span className="group-open:hidden">
                    Show {(terms?.history?.length ?? 0) - 1} previous acceptance
                    {(terms?.history?.length ?? 0) > 2 ? "s" : ""} ↓
                  </span>
                  <span className="hidden group-open:inline">Hide history ↑</span>
                </summary>
                <ul className="mt-3 space-y-2">
                  {(terms?.history ?? []).slice(1).map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-xs"
                    >
                      <span className="font-mono text-muted-foreground">
                        {t.termsVersion}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(t.acceptedAt).toLocaleDateString()}
                        {t.locale && ` · ${t.locale}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
