import { getSession } from "@repo/auth";
import type { Locale } from "@repo/i18n";
import { AppShell, EmptyState, PageHeader, type StateAction } from "@repo/ui";
import { PermissionGate } from "@repo/ui/permission-gate";
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
  permission?: string;
  deniedAction?: StateAction;
  children: ReactNode;
};

export async function ControlPanelShell({
  locale,
  breadcrumbLabel,
  title,
  description,
  action,
  permission = "control-panel:read",
  deniedAction,
  children,
}: ControlPanelShellProps) {
  const session = await getSession();

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
      <PermissionGate
        session={session}
        permission={permission}
        fallback={
          <EmptyState
            title="Access denied"
            description="Platform control is available only to platform roles."
            {...(deniedAction ? { action: deniedAction } : {})}
          />
        }
      >
        <PageHeader title={title} description={description} actions={action} />
        {children}
      </PermissionGate>
    </AppShell>
  );
}
