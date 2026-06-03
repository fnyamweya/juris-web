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
