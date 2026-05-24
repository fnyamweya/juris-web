import type { Locale } from "@repo/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { ConsolePageShell } from "@/components/console-page-shell";

const logs = [
  "[12:03:10] INFO  Tenant sync completed for Acme Legal Group",
  "[12:05:41] WARN  Retrying invoice webhook for Nova Compliance",
  "[12:07:12] INFO  Access token rotated for Billing service",
  "[12:09:54] ERROR Rate limit threshold reached on reporting export",
  "[12:11:30] INFO  Retry completed and queue normalized",
];

export default async function OperationsLogsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <ConsolePageShell
      locale={locale}
      breadcrumbLabel="Logs"
      title="Operations Logs"
      description="Recent platform logs for quick triage and debugging."
    >
      <Card>
        <CardHeader>
          <CardTitle>Live logs</CardTitle>
          <CardDescription>
            Stream sample from the operations event bus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-6">
            {logs.join("\n")}
          </pre>
        </CardContent>
      </Card>
    </ConsolePageShell>
  );
}
