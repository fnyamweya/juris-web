export function getSettingsNavItems(locale: string) {
  return [
    { label: "Console",  href: `/${locale}/console`,  permission: "console:read" },
    { label: "Admin",    href: `/${locale}/admin`,     permission: "admin:read" },
    { label: "Billing",  href: `/${locale}/billing`,   permission: "billing:read" },
    { label: "Reports",  href: `/${locale}/reports`,   permission: "reporting:read" },
    { label: "Settings", href: `/${locale}/settings`,  permission: "settings:read" },
    { label: "Support",  href: `/${locale}/support`,   permission: "support:read" },
  ];
}

export function getSettingsBreadcrumb(locale: string, label: string) {
  return [
    { label: "Juris",    href: `/${locale}` },
    { label: "Settings", href: `/${locale}/settings` },
    { label },
  ];
}

export function getMyAccountNavItems(locale: string) {
  return [
    { label: "Console",    href: `/${locale}/console`,   permission: "console:read" },
    { label: "My Account", href: `/${locale}/settings`,  permission: "settings:read" },
    { label: "Support",    href: `/${locale}/support`,   permission: "support:read" },
  ];
}

export function getMyAccountSideNav(locale: string) {
  return [
    { label: "Personal Info",      href: `/${locale}/settings/personal-info`, icon: "User" },
    { label: "Security & Sign In", href: `/${locale}/settings/security`,       icon: "ShieldCheck" },
    { label: "Data & Privacy",     href: `/${locale}/settings/privacy`,        icon: "Eye" },
  ];
}

export function getMyAccountBreadcrumb(locale: string, label: string) {
  return [
    { label: "My Account", href: `/${locale}/settings` },
    { label },
  ];
}
