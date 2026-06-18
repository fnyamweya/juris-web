import type { Locale } from "@repo/i18n";
import { getMessages } from "@repo/i18n";
import { requirePermission } from "@repo/auth";
import { createCivisClient, CivisApiError } from "@repo/civis";
import type { PlatformUser } from "@repo/civis";
import {
  AppShell,
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
import { createTranslator } from "next-intl";
import { ResetPlatformUserPasswordButton } from "./credential-actions";

const NAV = (locale: string) => [
  { label: "Console", href: `/${locale}/console`, permission: "console:read" },
  { label: "Admin", href: `/${locale}/admin`, permission: "admin:read" },
  { label: "Billing", href: `/${locale}/billing`, permission: "billing:read" },
  { label: "Reports", href: `/${locale}/reports`, permission: "reporting:read" },
  { label: "Settings", href: `/${locale}/settings`, permission: "settings:read" },
  { label: "Support", href: `/${locale}/support`, permission: "support:read" },
];

async function fetchUsers(): Promise<PlatformUser[]> {
  try {
    const client = await createCivisClient();
    const page = await client.users.list({ limit: 100 });
    return page.data;
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return [];
  }
}

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages });
  const session = await requirePermission("admin:read", { redirectTo: `/${locale}/console` });
  const users = await fetchUsers();

  return (
    <AppShell
      appName="Admin"
      navItems={NAV(locale)}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      logoutUrl={`/api/auth/logout?locale=${locale}`}
      breadcrumb={
        <Breadcrumb
          items={[
            { label: "Juris", href: `/${locale}` },
            { label: "Admin", href: `/${locale}/admin` },
            { label: "Users" },
          ]}
        />
      }
    >
        <PageHeader
          title="Users"
          description="All platform users and their current status."
          actions={<Button variant="outline">{t("common.search")}</Button>}
        />
        <Card>
          <CardHeader>
            <CardTitle>Platform users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={["Name", "Email", "Roles", "Status", "Credentials"]}
              rows={users.map((u) => ({
                Name: u.displayName,
                Email: u.email,
                Roles: u.platformRoles.join(", ") || "—",
                Status: (
                  <StatusBadge
                    status={u.status === "ACTIVE" ? "active" : "pending"}
                  />
                ),
                Credentials: <ResetPlatformUserPasswordButton userId={u.id} />,
              }))}
            />
          </CardContent>
        </Card>
    </AppShell>
  );
}
