import type { Locale } from "@repo/i18n";
import { requirePermission } from "@repo/auth";
import { CivisApiError, createCivisClient } from "@repo/civis";
import type { MarketingPreferences, PrivacyPreferences, TermsStatus } from "@repo/civis";
import {
  AppShell,
  Badge,
  Breadcrumb,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  EmptyState,
  PageHeader,
} from "@repo/ui";
import { getSettingsBreadcrumb, getSettingsNavItems } from "@/lib/navigation";

async function fetchPrivacyData(): Promise<{
  marketing: MarketingPreferences | null;
  privacy: PrivacyPreferences | null;
  terms: TermsStatus | null;
}> {
  try {
    const client = await createCivisClient();
    const [prefs, terms] = await Promise.all([
      client.me.preferences.get(),
      client.me.terms.get(),
    ]);
    return {
      marketing: prefs.marketing,
      privacy: prefs.privacy,
      terms,
    };
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return { marketing: null, privacy: null, terms: null };
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
        description="Marketing communications, telemetry controls, and Terms & Conditions history."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Marketing opt-ins */}
        <Card>
          <CardHeader>
            <CardTitle>Marketing communications</CardTitle>
            <CardDescription>
              Emails and updates from Juris and our partners.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ConsentRow
              label="Product updates & news"
              enabled={marketing?.productUpdates ?? true}
            />
            <ConsentRow
              label="Email marketing"
              enabled={marketing?.emailMarketing ?? false}
            />
            <ConsentRow
              label="Research invitations"
              enabled={marketing?.researchInvitations ?? false}
            />
            <ConsentRow
              label="Partner offers"
              enabled={marketing?.partnerOffers ?? false}
            />
          </CardContent>
        </Card>

        {/* Privacy & telemetry */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy & telemetry</CardTitle>
            <CardDescription>
              Usage data shared to improve the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ConsentRow
              label="Analytics"
              enabled={privacy?.analytics ?? true}
            />
            <ConsentRow
              label="Crash reporting"
              enabled={privacy?.crashReporting ?? true}
            />
            <ConsentRow
              label="Performance monitoring"
              enabled={privacy?.performanceMonitoring ?? true}
            />
            <ConsentRow
              label="Personalisation"
              enabled={privacy?.personalization ?? true}
            />
          </CardContent>
        </Card>

        {/* Terms & Conditions history */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
            <CardDescription>
              Complete history of your T&amp;C acceptances. The most recent
              version you accepted is shown first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!terms?.history?.length ? (
              <EmptyState
                title="No acceptance on record"
                description="You have not yet accepted the Terms & Conditions."
              />
            ) : (
              <DataTable
                columns={["Version", "Accepted at", "Channel", "Locale"]}
                rows={terms.history.map((t) => ({
                  Version: t.termsVersion,
                  "Accepted at": new Date(t.acceptedAt).toLocaleString(),
                  Channel: t.channel,
                  Locale: t.locale ?? "—",
                }))}
              />
            )}
            {terms?.latest && (
              <p className="mt-3 text-xs text-muted-foreground">
                Current accepted version:{" "}
                <span className="font-mono">{terms.latest.termsVersion}</span>
                {" · "}
                accepted{" "}
                {new Date(terms.latest.acceptedAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function ConsentRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant={enabled ? "default" : "outline"} className="text-xs">
        {enabled ? "Opted in" : "Opted out"}
      </Badge>
    </div>
  );
}
