import { requirePermission } from "@repo/auth";
import type { Locale } from "@repo/i18n";
import { AppShell, Breadcrumb, PageHeader } from "@repo/ui";
import type { ReactNode } from "react";
import { getMyAccountBreadcrumb, getMyAccountNavItems } from "@/lib/navigation";

type MyAccountPageShellProps = {
  locale: Locale;
  breadcrumbLabel: string;
  title: string;
  description: string;
  action?: ReactNode;
  permission?: string;
  children: ReactNode;
};

export async function MyAccountPageShell({
  locale,
  breadcrumbLabel,
  title,
  description,
  action,
  permission = "settings:read",
  children,
}: MyAccountPageShellProps) {
  const session = await requirePermission(permission, {
    redirectTo: `/${locale}/login`,
  });

  return (
    <AppShell
      appId="settings"
      appName="My Account"
      navItems={getMyAccountNavItems(locale)}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      breadcrumb={<Breadcrumb items={getMyAccountBreadcrumb(locale, breadcrumbLabel)} />}
      logoutUrl={`/api/auth/logout?locale=${locale}`}
    >
      <PageHeader title={title} description={description} actions={action} />
      {children}
    </AppShell>
  );
}
