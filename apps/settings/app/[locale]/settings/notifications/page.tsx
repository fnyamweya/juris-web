import type { Locale } from "@repo/i18n";
import { requirePermission } from "@repo/auth";
import { CivisApiError, createCivisClient } from "@repo/civis";
import type { UserTenantPreferences } from "@repo/civis";
import {
  AppShell,
  Badge,
  Breadcrumb,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
} from "@repo/ui";
import { getSettingsBreadcrumb, getSettingsNavItems } from "@/lib/navigation";

async function fetchNotificationPrefs(
  tenantId: string,
): Promise<UserTenantPreferences | null> {
  try {
    const client = await createCivisClient(tenantId);
    return await client.me.preferences.tenant.get(tenantId);
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return null;
  }
}

export default async function SettingsNotificationsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await requirePermission("settings:read", {
    redirectTo: `/${locale}/console`,
  });
  const tenantId = session.currentTenant?.id;
  const prefs = tenantId ? await fetchNotificationPrefs(tenantId) : null;
  const channels = prefs?.notifications.channels;
  const digest = prefs?.notifications.digest;
  const categories = prefs?.notifications.categories;

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
      breadcrumb={<Breadcrumb items={getSettingsBreadcrumb(locale, "Notifications")} />}
    >
      <PageHeader
        title="Notifications"
        description="Control how and when you receive notifications for this organisation."
      />

      {!tenantId ? (
        <EmptyState
          title="No organisation selected"
          description="Select an organisation to manage notification preferences."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Delivery channels */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery channels</CardTitle>
              <CardDescription>
                Which channels you want to receive notifications on.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ChannelRow label="Email"     enabled={channels?.email ?? true} />
              <ChannelRow label="SMS"       enabled={channels?.sms ?? false} />
              <ChannelRow label="Push"      enabled={channels?.push ?? false} />
              <ChannelRow label="WhatsApp"  enabled={channels?.whatsapp ?? false} />
            </CardContent>
          </Card>

          {/* Digest settings */}
          <Card>
            <CardHeader>
              <CardTitle>Digest schedule</CardTitle>
              <CardDescription>
                How often to bundle non-urgent notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row
                label="Frequency"
                value={
                  digest?.frequency === "instant" ? "Instant (real-time)"
                  : digest?.frequency === "hourly"  ? "Hourly"
                  : digest?.frequency === "daily"   ? "Daily"
                  : digest?.frequency === "weekly"  ? "Weekly"
                  : digest?.frequency === "none"    ? "Off"
                  : "Daily"
                }
              />
              {digest?.frequency !== "none" && digest?.frequency !== "instant" && (
                <Row
                  label="Delivery hour (UTC)"
                  value={`${String(digest?.hourUtc ?? 8).padStart(2, "0")}:00 UTC`}
                />
              )}
            </CardContent>
          </Card>

          {/* Notification categories */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Which types of events trigger notifications for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ChannelRow label="Security alerts"       enabled={categories?.securityAlerts ?? true} />
              <ChannelRow label="Member events"         enabled={categories?.memberEvents ?? true} />
              <ChannelRow label="Billing events"        enabled={categories?.billingEvents ?? true} />
              <ChannelRow label="System announcements"  enabled={categories?.systemAnnouncements ?? true} />
              <ChannelRow label="Custom events"         enabled={categories?.customEvents ?? false} />
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant="outline" className="font-mono text-xs">{value}</Badge>
    </div>
  );
}

function ChannelRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant={enabled ? "default" : "outline"} className="text-xs">
        {enabled ? "On" : "Off"}
      </Badge>
    </div>
  );
}
