import type { Locale } from "@repo/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
} from "@repo/ui";
import { ConsolePageShell } from "@/components/console-page-shell";

const queueRows = [
  {
    Job: "Matter export",
    Tenant: "Acme Legal Group",
    Priority: "High",
    State: "Running",
  },
  {
    Job: "User sync",
    Tenant: "Kilimani Chambers",
    Priority: "Normal",
    State: "Queued",
  },
  {
    Job: "Invoice webhook",
    Tenant: "Nova Compliance",
    Priority: "High",
    State: "Retrying",
  },
  {
    Job: "Audit backup",
    Tenant: "Juris Labs",
    Priority: "Low",
    State: "Queued",
  },
];

export default async function OperationsQueuePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <ConsolePageShell
      locale={locale}
      breadcrumbLabel="Queue"
      title="Operations Queue"
      description="Track asynchronous jobs across provisioning, billing, and compliance workloads."
    >
      <Card>
        <CardHeader>
          <CardTitle>Current queue</CardTitle>
          <CardDescription>Processing states for active jobs.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={["Job", "Tenant", "Priority", "State"]}
            rows={queueRows}
          />
        </CardContent>
      </Card>
    </ConsolePageShell>
  );
}
