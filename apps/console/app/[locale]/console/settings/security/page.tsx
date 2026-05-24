import type { Locale } from "@repo/i18n";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { ConsolePageShell } from "@/components/console-page-shell";

const controls = [
  { name: "MFA Enforcement", state: "Enabled" },
  { name: "Session Timeout", state: "30 minutes" },
  { name: "IP Allowlist", state: "Review required" },
  { name: "Audit Export", state: "Daily" },
];

export default async function ConsoleSecuritySettingsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <ConsolePageShell
      locale={locale}
      breadcrumbLabel="Security"
      title="Security Settings"
      description="Core controls for tenant-level security posture in the console app."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {controls.map((item) => (
          <Card key={item.name}>
            <CardHeader>
              <CardTitle className="text-base">{item.name}</CardTitle>
              <CardDescription>Current setting</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{item.state}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </ConsolePageShell>
  );
}
