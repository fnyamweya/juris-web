import { createTranslator } from "next-intl";
import { getMessages } from "@repo/i18n";
import type { Locale } from "@repo/i18n";
import { getMockSession } from "@repo/auth";
import {
  AppShell,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@repo/ui";
import { PermissionGate } from "@repo/ui/permission-gate";
import { articles, tickets } from "@/mock-data";

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
        { label: "Support" },
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
      appName="Support"
      navItems={navItems}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      breadcrumb={getBreadcrumb(locale, "Support")}
    >
      <PermissionGate
        session={session}
        permission="support:read"
        fallback={
          <EmptyState
            title="Access denied"
            description="Your mock session does not include this permission."
          />
        }
      >
        <PageHeader
          title="Support"
          description="Ticket, knowledge base, and contact workflows for service teams."
          actions={<Button variant="outline">{t("common.search")}</Button>}
        />
        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={["Ticket", "Subject", "Status"]}
                rows={tickets.map((row) => ({
                  ...row,
                  Status: (
                    <StatusBadge status={row.Status as "active" | "pending"} />
                  ),
                }))}
              />
            </CardContent>
          </Card>
          <div className="grid gap-4">
            {articles.map((article) => (
              <Card key={article.title}>
                <CardHeader>
                  <CardTitle>{article.title}</CardTitle>
                  <CardDescription>{article.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </PermissionGate>
    </AppShell>
  );
}
