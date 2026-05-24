import { createTranslator } from "next-intl";
import { formatCurrency, getMessages } from "@repo/i18n";
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
import { invoices, plans } from "@/mock-data";

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
        { label: "Billing" },
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
      appName="Billing"
      navItems={navItems}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      breadcrumb={getBreadcrumb(locale, "Plans")}
    >
      <PermissionGate
        session={session}
        permission="billing:read"
        fallback={
          <EmptyState
            title="Access denied"
            description="Your mock session does not include this permission."
          />
        }
      >
        <PageHeader
          title="Plans"
          description="Revenue workflows with invoice, plan, and payment method visibility. This view focuses on plans."
          actions={<Button variant="outline">{t("common.search")}</Button>}
        />
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="pt-6 text-sm">
            Some data may be delayed. Read-only mode is active.
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.name}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {formatCurrency(plan.price, locale)}
                </div>
                <Button className="mt-4" disabled>
                  Change plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={["Invoice", "Customer", "Amount", "Status"]}
              rows={invoices.map((row) => ({
                ...row,
                Amount: formatCurrency(row.Amount, locale),
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
