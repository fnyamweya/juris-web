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
} from "@repo/ui";
import { PermissionGate } from "@repo/ui/permission-gate";
import { preferences } from "@/mock-data";

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
        { label: "Settings" },
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
      appName="Settings"
      navItems={navItems}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      breadcrumb={getBreadcrumb(locale, "Profile")}
    >
      <PermissionGate
        session={session}
        permission="settings:read"
        fallback={
          <EmptyState
            title="Access denied"
            description="Your mock session does not include this permission."
          />
        }
      >
        <PageHeader
          title="Profile"
          description="User and organization preferences with secure defaults. This view focuses on profile."
          actions={<Button variant="outline">{t("common.search")}</Button>}
        />
        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Mock profile values for local development.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <span className="text-sm font-medium">Name</span>
                <span className="rounded-md border px-3 py-2 text-sm">
                  Amara Okafor
                </span>
              </div>
              <div className="grid gap-2">
                <span className="text-sm font-medium">Email</span>
                <span className="rounded-md border px-3 py-2 text-sm">
                  amara.okafor@example.com
                </span>
              </div>
              <Button>Save</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={["key", "value"]} rows={preferences} />
            </CardContent>
          </Card>
        </div>
      </PermissionGate>
    </AppShell>
  );
}
