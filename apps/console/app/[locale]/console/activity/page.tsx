import type { Locale } from "@repo/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
} from "@repo/ui";
import { ConsolePageShell } from "@/components/console-page-shell";

const activityFeed = [
  {
    Actor: "System",
    Action: "Workspace role sync",
    Target: "Acme Legal Group",
    Time: "2 minutes ago",
    Severity: "Info",
  },
  {
    Actor: "Nadia Kim",
    Action: "Provisioned new tenant",
    Target: "Kilimani Chambers",
    Time: "8 minutes ago",
    Severity: "Success",
  },
  {
    Actor: "Gateway",
    Action: "Rate limit event",
    Target: "Nova Compliance",
    Time: "19 minutes ago",
    Severity: "Warning",
  },
  {
    Actor: "Audit Bot",
    Action: "Permission policy changed",
    Target: "Global org policy",
    Time: "35 minutes ago",
    Severity: "Critical",
  },
];

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "Success") {
    return (
      <Badge className="bg-success text-white hover:bg-success">Success</Badge>
    );
  }

  if (severity === "Warning") {
    return (
      <Badge className="bg-warning text-black hover:bg-warning">Warning</Badge>
    );
  }

  if (severity === "Critical") {
    return <Badge variant="destructive">Critical</Badge>;
  }

  return <Badge variant="secondary">Info</Badge>;
}

export default async function ConsoleActivityPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <ConsolePageShell
      locale={locale}
      breadcrumbLabel="Activity"
      title="Activity Feed"
      description="Trace operational events and monitor policy-sensitive changes across tenants."
      action={<Button variant="outline">Download audit log</Button>}
    >
      <Card>
        <CardHeader>
          <CardTitle>Event stream</CardTitle>
          <CardDescription>
            Ordered activity records with severity and ownership context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={["Actor", "Action", "Target", "Time", "Severity"]}
            rows={activityFeed.map((row) => ({
              ...row,
              Severity: <SeverityBadge severity={row.Severity} />,
            }))}
          />
        </CardContent>
      </Card>
    </ConsolePageShell>
  );
}
