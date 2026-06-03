import type { Locale } from "@repo/i18n";
import { requirePermission } from "@repo/auth";
import {
  AppShell,
  Breadcrumb,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from "@repo/ui";
import Link from "next/link";
import { getSettingsNavItems } from "@/lib/navigation";

const SETTINGS_SECTIONS = (locale: string) => [
  {
    title: "Preferences",
    description: "Appearance, language, timezone, and regional formatting.",
    href: `/${locale}/settings/preferences`,
    permission: "settings:read",
  },
  {
    title: "Security",
    description: "MFA methods, active sessions, and trusted devices.",
    href: `/${locale}/settings/security`,
    permission: "settings:read",
  },
  {
    title: "Notifications",
    description: "Delivery channels, digest schedule, and event categories.",
    href: `/${locale}/settings/notifications`,
    permission: "settings:read",
  },
  {
    title: "Privacy",
    description: "Marketing opt-ins, telemetry controls, and T&C history.",
    href: `/${locale}/settings/privacy`,
    permission: "settings:read",
  },
  {
    title: "Profile",
    description: "Display name and account information.",
    href: `/${locale}/settings/profile`,
    permission: "settings:read",
  },
  {
    title: "Organisation",
    description: "Organisation-level settings and configuration.",
    href: `/${locale}/settings/organization`,
    permission: "settings:write",
  },
];

export default async function SettingsIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await requirePermission("settings:read", {
    redirectTo: `/${locale}/console`,
  });
  const sections = SETTINGS_SECTIONS(locale).filter(
    (s) => session.permissions.includes(s.permission),
  );

  return (
    <AppShell
      appName="Settings"
      navItems={getSettingsNavItems(locale)}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      logoutUrl={`/api/auth/logout?locale=${locale}`}
      breadcrumb={
        <Breadcrumb
          items={[
            { label: "Juris", href: `/${locale}` },
            { label: "Settings" },
          ]}
        />
      }
    >
      <PageHeader
        title="Settings"
        description="Manage your personal preferences, security, and organisation settings."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="group block">
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{section.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
