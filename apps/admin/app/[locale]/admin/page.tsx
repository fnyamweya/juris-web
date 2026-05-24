import { createTranslator } from "next-intl";
import { getMessages } from "@repo/i18n";
import type { Locale } from "@repo/i18n";
import { getMockSession } from "@repo/auth";
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
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@repo/ui";
import { PermissionGate } from "@repo/ui/permission-gate";
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
  const session = await getMockSession();
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
      breadcrumb={getBreadcrumb(locale, "Admin Operations")}
    >
      <PermissionGate
        session={session}
        permission="admin:read"
        fallback={
          <EmptyState
            title="Access denied"
            description="Your mock session does not include this permission."
          />
        }
      >
        <PageHeader
          title="Admin Operations"
          description="Internal controls for users, tenants, and audit evidence."
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
      </PermissionGate>
    </AppShell>
  );
}
