import type { Locale } from "@repo/i18n";
import { getMessages } from "@repo/i18n";
import { getSession } from "@repo/auth";
import { createCivisClient, CivisApiError } from "@repo/civis";
import type { Tenant } from "@repo/civis";
import {
  AppShell,
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
import { createTranslator } from "next-intl";

const NAV = (locale: string) => [
  { label: "Console", href: `/${locale}/console`, permission: "console:read" },
  { label: "Admin", href: `/${locale}/admin`, permission: "admin:read" },
  { label: "Billing", href: `/${locale}/billing`, permission: "billing:read" },
  { label: "Reports", href: `/${locale}/reports`, permission: "reporting:read" },
  { label: "Settings", href: `/${locale}/settings`, permission: "settings:read" },
  { label: "Support", href: `/${locale}/support`, permission: "support:read" },
];

async function fetchTenants(): Promise<Tenant[]> {
  try {
    const client = await createCivisClient();
    const page = await client.tenants.list({ limit: 100 });
    return page.data;
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return [];
  }
}

function statusVariant(status: Tenant["status"]): "active" | "pending" | "inactive" {
  if (status === "ACTIVE") return "active";
  if (status === "SUSPENDED") return "pending";
  return "inactive";
}

export default async function AdminTenantsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages });
  const session = await getSession();
  const tenants = await fetchTenants();

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
            { label: "Tenants" },
          ]}
        />
      }
    >
      <PermissionGate
        session={session}
        permission="admin:read"
        fallback={
          <EmptyState
            title="Access denied"
            description="You need the admin:read permission to view tenants."
          />
        }
      >
        <PageHeader
          title="Tenants"
          description="All registered tenants and their current lifecycle state."
          actions={<Button variant="outline">{t("common.search")}</Button>}
        />
        <Card>
          <CardHeader>
            <CardTitle>Tenants ({tenants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={["Name", "Slug", "Plan", "Region", "Status"]}
              rows={tenants.map((tn) => ({
                Name: tn.displayName,
                Slug: tn.slug,
                Plan: tn.plan,
                Region: tn.region,
                Status: (
                  <StatusBadge status={statusVariant(tn.status)} />
                ),
              }))}
            />
          </CardContent>
        </Card>
      </PermissionGate>
    </AppShell>
  );
}
