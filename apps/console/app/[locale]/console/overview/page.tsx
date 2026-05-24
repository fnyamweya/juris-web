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
  StatusBadge,
} from "@repo/ui";
import { activityRows, metrics } from "@/mock-data";
import { ConsolePageShell } from "@/components/console-page-shell";

export default async function ConsoleOverviewPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <ConsolePageShell
      locale={locale}
      breadcrumbLabel="Overview"
      title="Console Overview"
      description="Tenant operations, request volume, and platform health at a glance."
      action={<Button variant="outline">Export snapshot</Button>}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Live operations from the last 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={["Event", "Tenant", "Status"]}
            rows={activityRows.map((row) => ({
              ...row,
              Status: (
                <StatusBadge status={row.Status as "active" | "pending"} />
              ),
            }))}
          />
        </CardContent>
      </Card>
    </ConsolePageShell>
  );
}
