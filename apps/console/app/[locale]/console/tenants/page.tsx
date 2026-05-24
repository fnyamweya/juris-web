import type { Locale } from "@repo/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  MetricCard,
} from "@repo/ui";
import { ConsolePageShell } from "@/components/console-page-shell";

const tenantMetrics = [
  {
    title: "Total tenants",
    value: "128",
    change: "+5 this week",
    trend: "up" as const,
  },
  {
    title: "Pending onboarding",
    value: "9",
    change: "2 waiting review",
    trend: "flat" as const,
  },
  {
    title: "Suspended",
    value: "3",
    change: "No new suspensions",
    trend: "down" as const,
  },
  {
    title: "SLA risk",
    value: "4",
    change: "2 above threshold",
    trend: "up" as const,
  },
];

const tenantRows = [
  {
    Tenant: "Acme Legal Group",
    Region: "US-East",
    Plan: "Enterprise",
    Status: "Active",
  },
  {
    Tenant: "Kilimani Chambers",
    Region: "Africa",
    Plan: "Growth",
    Status: "Active",
  },
  {
    Tenant: "Nova Compliance",
    Region: "EU-West",
    Plan: "Starter",
    Status: "Pending",
  },
  {
    Tenant: "Juris Labs",
    Region: "US-West",
    Plan: "Enterprise",
    Status: "Active",
  },
];

export default async function ConsoleTenantsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <ConsolePageShell
      locale={locale}
      breadcrumbLabel="Tenants"
      title="Tenant Directory"
      description="Monitor organization footprint, onboarding progress, and deployment regions."
      action={<Button>Invite tenant</Button>}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tenantMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current tenants</CardTitle>
          <CardDescription>
            Internal registry with current plan and health status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={["Tenant", "Region", "Plan", "Status"]}
            rows={tenantRows}
          />
        </CardContent>
      </Card>
    </ConsolePageShell>
  );
}
