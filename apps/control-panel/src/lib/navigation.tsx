import type { Locale } from "@repo/i18n";
import { Breadcrumb, type NavItem } from "@repo/ui";

export function getControlPanelNavItems(locale: string): NavItem[] {
  return [
    {
      section: "Control Panel",
      label: "Overview",
      href: `/${locale}/control-panel/overview`,
      permission: "control-panel:read",
    },
    {
      section: "Control Panel",
      label: "Onboard Tenant",
      href: `/${locale}/control-panel/onboarding`,
      permission: "control-panel:write",
    },
    {
      section: "Tenancy",
      label: "Tenants",
      href: `/${locale}/control-panel/tenants`,
      permission: "control-panel:read",
    },
    {
      section: "Tenancy",
      label: "Policies",
      href: `/${locale}/control-panel/policies`,
      permission: "control-panel:read",
    },
    {
      section: "Tenancy",
      label: "API Actions",
      href: `/${locale}/control-panel/actions`,
      permission: "control-panel:read",
    },
    {
      section: "Platform Apps",
      label: "Console",
      href: `/${locale}/console`,
      permission: "console:read",
    },
    {
      section: "Platform Apps",
      label: "Admin",
      href: `/${locale}/admin`,
      permission: "admin:read",
    },
    {
      section: "Platform Apps",
      label: "Docs",
      href: `/${locale}/docs`,
    },
  ];
}

export function getControlPanelBreadcrumb(locale: Locale, label: string) {
  return (
    <Breadcrumb
      items={[
        { label: "Juris", href: `/${locale}` },
        { label: "Control Panel", href: `/${locale}/control-panel` },
        { label },
      ]}
    />
  );
}
