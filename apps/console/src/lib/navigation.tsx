import type { Locale } from "@repo/i18n";
import { Breadcrumb, type NavItem } from "@repo/ui";

export function getConsoleNavItems(locale: string): NavItem[] {
  return [
    {
      section: "General",
      label: "Overview",
      href: `/${locale}/console/overview`,
      permission: "console:read",
    },
    {
      section: "General",
      label: "Workspaces",
      href: `/${locale}/console/workspaces`,
      permission: "console:read",
    },
    {
      section: "General",
      label: "Activity",
      href: `/${locale}/console/activity`,
      permission: "console:read",
    },
    {
      section: "Management",
      label: "Tenants",
      href: `/${locale}/console/tenants`,
      permission: "console:read",
    },
    {
      section: "Management",
      label: "Operations",
      href: `/${locale}/console/operations`,
      permission: "console:read",
      items: [
        {
          label: "Queue",
          href: `/${locale}/console/operations/queue`,
          permission: "console:read",
        },
        {
          label: "Integrations",
          href: `/${locale}/console/operations/integrations`,
          permission: "console:read",
        },
        {
          label: "Logs",
          href: `/${locale}/console/operations/logs`,
          permission: "console:read",
        },
      ],
    },
    {
      section: "System",
      label: "Settings",
      href: `/${locale}/console/settings`,
      permission: "console:read",
      items: [
        {
          label: "Appearance",
          href: `/${locale}/console/settings/appearance`,
          permission: "console:read",
        },
        {
          label: "Security",
          href: `/${locale}/console/settings/security`,
          permission: "console:read",
        },
      ],
    },
    {
      section: "System",
      label: "401 Demo",
      href: `/${locale}/401`,
      permission: "console:read",
    },
    {
      section: "Apps",
      label: "Admin",
      href: `/${locale}/admin`,
    },
    {
      section: "Apps",
      label: "Billing",
      href: `/${locale}/billing`,
    },
    {
      section: "Apps",
      label: "Reporting",
      href: `/${locale}/reports`,
    },
    {
      section: "Apps",
      label: "Settings",
      href: `/${locale}/settings`,
    },
    {
      section: "Apps",
      label: "Support",
      href: `/${locale}/support`,
    },
    {
      section: "Apps",
      label: "Docs",
      href: `/${locale}/docs`,
    },
    {
      section: "Apps",
      label: "Public Site",
      href: `/${locale}`,
    },
  ];
}

export function getConsoleBreadcrumb(locale: Locale, label: string) {
  return (
    <Breadcrumb
      items={[
        { label: "Juris", href: `/${locale}` },
        { label: "Console", href: `/${locale}/console` },
        { label },
      ]}
    />
  );
}
