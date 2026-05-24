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

const integrations = [
  { name: "Clerk", status: "Healthy", lastSync: "2m ago" },
  { name: "Stripe", status: "Healthy", lastSync: "5m ago" },
  { name: "S3 Archive", status: "Delayed", lastSync: "17m ago" },
  { name: "PagerDuty", status: "Healthy", lastSync: "4m ago" },
];

export default async function OperationsIntegrationsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <ConsolePageShell
      locale={locale}
      breadcrumbLabel="Integrations"
      title="Integrations"
      description="Connected systems and health indicators for tenant-facing operations."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {integrations.map((integration) => (
          <Card key={integration.name}>
            <CardHeader>
              <CardTitle className="text-base">{integration.name}</CardTitle>
              <CardDescription>
                Last sync {integration.lastSync}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integration.status === "Healthy" ? (
                <Badge className="bg-success text-white hover:bg-success">
                  Healthy
                </Badge>
              ) : (
                <Badge className="bg-warning text-black hover:bg-warning">
                  Delayed
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ConsolePageShell>
  );
}
