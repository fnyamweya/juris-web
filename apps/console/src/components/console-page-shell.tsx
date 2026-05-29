import { getSession } from "@repo/auth";
import type { Locale } from "@repo/i18n";
import { AppShell, EmptyState, PageHeader, type StateAction } from "@repo/ui";
import { PermissionGate } from "@repo/ui/permission-gate";
import type { ReactNode } from "react";
import { getConsoleBreadcrumb, getConsoleNavItems } from "@/lib/navigation";

type ConsolePageShellProps = {
  locale: Locale;
  breadcrumbLabel: string;
  title: string;
  description: string;
  action?: ReactNode;
  permission?: string;
  deniedAction?: StateAction;
  children: ReactNode;
};

export async function ConsolePageShell({
  locale,
  breadcrumbLabel,
  title,
  description,
  action,
  permission = "console:read",
  deniedAction,
  children,
}: ConsolePageShellProps) {
  const session = await getSession();

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
      <PermissionGate
        session={session}
        permission={permission}
        fallback={
          <EmptyState
            title="Access denied"
            description="Your mock session does not include this permission."
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
