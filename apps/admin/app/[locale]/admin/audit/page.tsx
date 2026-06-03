import { createTranslator } from "next-intl";
import { getMessages } from "@repo/i18n";
import type { Locale } from "@repo/i18n";
import { requirePermission } from "@repo/auth";
import {
  AppShell,
  AuditEventList,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  PageHeader,
  StatusBadge,
} from "@repo/ui";
import { auditEvents, tenants, users } from "@/mock-data";

function getNavItems(locale: string) {
  return [
    {
      label: "Console",
      href: "/" + locale + "/console",
      permission: "console:read",
    },
    {
      label: "Admin",
      href: "/" + locale + "/admin",
      permission: "admin:read",
    },
    {
      label: "Billing",
      href: "/" + locale + "/billing",
      permission: "billing:read",
    },
    {
      label: "Reports",
      href: "/" + locale + "/reports",
      permission: "reporting:read",
    },
    {
      label: "Settings",
      href: "/" + locale + "/settings",
      permission: "settings:read",
    },
    {
      label: "Support",
      href: "/" + locale + "/support",
      permission: "support:read",
    },
  ];
}

function getBreadcrumb(locale: string, label: string) {
  return (
    <Breadcrumb
      items={[
        { label: "Juris", href: "/" + locale },
        { label: "Admin" },
        { label },
      ]}
    />
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages });
  const session = await requirePermission("admin:read", { redirectTo: `/${locale}/console` });
  const navItems = getNavItems(locale);

  return (
    <AppShell
      appName="Admin"
      navItems={navItems}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      logoutUrl={`/api/auth/logout?locale=${locale}`}
      breadcrumb={getBreadcrumb(locale, "Audit")}
    >
        <PageHeader
          title="Audit"
          description="Internal controls for users, tenants, and audit evidence. This view focuses on audit."
          actions={<Button variant="outline">{t("common.search")}</Button>}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={["Name", "Role", "Status"]}
                rows={users.map((row) => ({
                  ...row,
                  Status: (
                    <StatusBadge status={row.Status as "active" | "pending"} />
                  ),
                }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={["Name", "Plan", "Status"]}
                rows={tenants.map((row) => ({
                  ...row,
                  Status: (
                    <StatusBadge status={row.Status as "active" | "inactive"} />
                  ),
                }))}
              />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Audit events</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditEventList events={auditEvents} />
          </CardContent>
        </Card>
    </AppShell>
  );
}
