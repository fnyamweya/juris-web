import type { Locale } from "@repo/i18n";
import { requirePermission } from "@repo/auth";
import { CivisApiError, createCivisClient } from "@repo/civis";
import type { UserTenantPreferences } from "@repo/civis";
import {
  AppShell,
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
import { NotificationsForm } from "./notifications-form";

const DEFAULT_NOTIFICATIONS: UserTenantPreferences["notifications"] = {
  channels: { email: true, sms: false, push: false, whatsapp: false },
  digest: { frequency: "daily", hourUtc: 8 },
  categories: {
    securityAlerts: true,
    memberEvents: true,
    billingEvents: true,
    systemAnnouncements: true,
    customEvents: false,
  },
};

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
  const notifications = prefs?.notifications ?? DEFAULT_NOTIFICATIONS;

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
        description={
          tenantId
            ? `Notification preferences for ${session.currentTenant?.name ?? "your organisation"}. Changes save automatically.`
            : "Notification preferences are scoped to an organisation."
        }
      />

      {!tenantId ? (
        <EmptyState
          title="No organisation selected"
          description="Switch to an organisation to manage its notification preferences."
        />
      ) : (
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications for{" "}
                {session.currentTenant?.name ?? "this organisation"}.
                Your organisation administrator may also control which channels
                are available.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationsForm
                locale={locale}
                tenantId={tenantId}
                initial={notifications}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
