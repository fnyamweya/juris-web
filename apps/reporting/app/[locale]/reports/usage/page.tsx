import { createTranslator } from "next-intl";
import { formatDate, getMessages } from "@repo/i18n";
import type { Locale } from "@repo/i18n";
import { getMockSession } from "@repo/auth";
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
  MetricCard,
  PageHeader,
  StatusBadge,
} from "@repo/ui";
import { PermissionGate } from "@repo/ui/permission-gate";
import { exportsRows, reportMetrics } from "@/mock-data";

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
        { label: "Reporting" },
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
      appName="Reporting"
      navItems={navItems}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      breadcrumb={getBreadcrumb(locale, "Usage")}
    >
      <PermissionGate
        session={session}
        permission="reporting:read"
        fallback={
          <EmptyState
            title="Access denied"
            description="Your mock session does not include this permission."
          />
        }
      >
        <PageHeader
          title="Usage"
          description="Analytics, exports, and stale data awareness for enterprise reporting. This view focuses on usage."
          actions={<Button variant="outline">{t("common.search")}</Button>}
        />
        <Card className="border-info/40 bg-info/10">
          <CardContent className="pt-6 text-sm">
            Some data may be delayed. Read-only mode is active. Last refreshed{" "}
            {formatDate("2026-05-23T08:00:00.000Z", locale)}.
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          {reportMetrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Export queue</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={["Report", "Owner", "Status"]}
              rows={exportsRows.map((row) => ({
                ...row,
                Status: (
                  <StatusBadge status={row.Status as "active" | "pending"} />
                ),
              }))}
            />
          </CardContent>
        </Card>
      </PermissionGate>
    </AppShell>
  );
}
