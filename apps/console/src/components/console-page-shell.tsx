import { requirePermission } from "@repo/auth";
import type { Locale } from "@repo/i18n";
import { AppShell, PageHeader } from "@repo/ui";
import type { ReactNode } from "react";
import { getConsoleBreadcrumb, getConsoleNavItems } from "@/lib/navigation";

type ConsolePageShellProps = {
  locale: Locale;
  breadcrumbLabel: string;
  title: string;
  description: string;
  action?: ReactNode;
  /** Permission required to view this page. Defaults to "console:read". */
  permission?: string;
  children: ReactNode;
};

/**
 * Server Component shell for all console pages.
 * Calls requirePermission so any page using this shell is automatically
 * gated — defense-in-depth even when a page omits its own check.
 */
export async function ConsolePageShell({
  locale,
  breadcrumbLabel,
  title,
  description,
  action,
  permission = "console:read",
  children,
}: ConsolePageShellProps) {
  const session = await requirePermission(permission, {
    redirectTo: `/${locale}/login`,
  });

  return (
    <AppShell
      appId="console"
      appName="Console"
      navItems={getConsoleNavItems(locale)}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      breadcrumb={getConsoleBreadcrumb(locale, breadcrumbLabel)}
      logoutUrl={`/api/auth/logout?locale=${locale}`}
    >
      <PageHeader title={title} description={description} actions={action} />
      {children}
    </AppShell>
  );
}
