import { requirePermission } from "@repo/auth";
import type { Locale } from "@repo/i18n";
import { AppShell, PageHeader, type StateAction } from "@repo/ui";
import type { ReactNode } from "react";
import {
  getControlPanelBreadcrumb,
  getControlPanelNavItems,
} from "@/lib/navigation";

type ControlPanelShellProps = {
  locale: Locale;
  breadcrumbLabel: string;
  title: string;
  description: string;
  action?: ReactNode;
  /**
   * Minimum permission required to view this page.
   * Defaults to "control-panel:read".
   * Pages that need write access pass "control-panel:write".
   */
  permission?: string;
  children: ReactNode;
};

/**
 * Server Component shell for all control-panel pages.
 * Calls requirePermission so any page using this shell is automatically
 * gated — defense-in-depth even when a page omits its own check.
 */
export async function ControlPanelShell({
  locale,
  breadcrumbLabel,
  title,
  description,
  action,
  permission = "control-panel:read",
  children,
}: ControlPanelShellProps) {
  const session = await requirePermission(permission, {
    redirectTo: `/${locale}/console`,
  });

  return (
    <AppShell
      appId="control-panel"
      appName="Platform Control Panel"
      navItems={getControlPanelNavItems(locale)}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      breadcrumb={getControlPanelBreadcrumb(locale, breadcrumbLabel)}
      logoutUrl={`/api/auth/logout?locale=${locale}`}
    >
      <PageHeader title={title} description={description} actions={action} />
      {children}
    </AppShell>
  );
}
