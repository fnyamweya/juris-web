import { createTranslator } from "next-intl";
import { getMessages } from "@repo/i18n";
import type { Locale } from "@repo/i18n";
import { getSession } from "@repo/auth";
import { createCivisClient, CivisApiError } from "@repo/civis";
import type { PlatformUser, Tenant } from "@repo/civis";
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
import { auditEvents } from "@/mock-data";

function getNavItems(locale: string) {
  return [
    { label: "Console", href: "/" + locale + "/console", permission: "console:read" },
    { label: "Admin", href: "/" + locale + "/admin", permission: "admin:read" },
    { label: "Billing", href: "/" + locale + "/billing", permission: "billing:read" },
    { label: "Reports", href: "/" + locale + "/reports", permission: "reporting:read" },
    { label: "Settings", href: "/" + locale + "/settings", permission: "settings:read" },
    { label: "Support", href: "/" + locale + "/support", permission: "support:read" },
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

async function fetchAdminData(): Promise<{
  users: PlatformUser[];
  tenants: Tenant[];
}> {
  try {
    const client = await createCivisClient();
    const [usersPage, tenantsPage] = await Promise.all([
      client.users.list({ limit: 50 }),
      client.tenants.list({ limit: 50 }),
    ]);
    return { users: usersPage.data, tenants: tenantsPage.data };
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return { users: [], tenants: [] };
  }
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages });
  const session = await getSession();
  const navItems = getNavItems(locale);
  const { users, tenants } = await fetchAdminData();

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
      breadcrumb={getBreadcrumb(locale, "Admin Operations")}
    >
      <PermissionGate
        session={session}
        permission="admin:read"
        fallback={
          <EmptyState
            title="Access denied"
            description="You need the admin:read permission to view this page."
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
              <CardTitle>Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={["Name", "Email", "Status"]}
                rows={users.map((u) => ({
                  Name: u.displayName,
                  Email: u.email,
                  Status: (
                    <StatusBadge
                      status={u.status.toLowerCase() as "active" | "pending"}
                    />
                  ),
                }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tenants ({tenants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={["Name", "Plan", "Status"]}
                rows={tenants.map((t) => ({
                  Name: t.displayName,
                  Plan: t.plan,
                  Status: (
                    <StatusBadge
                      status={
                        t.status === "ACTIVE"
                          ? "active"
                          : t.status === "SUSPENDED"
                            ? "pending"
                            : "inactive"
                      }
                    />
                  ),
                }))}
              />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent audit events</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditEventList events={auditEvents} />
          </CardContent>
        </Card>
      </PermissionGate>
    </AppShell>
  );
}
