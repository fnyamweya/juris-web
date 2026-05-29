import type { Locale } from "@repo/i18n";
import { createCivisClient, CivisApiError } from "@repo/civis";
import type { Tenant } from "@repo/civis";
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
import { ConsolePageShell } from "@/components/console-page-shell";

async function fetchTenants(): Promise<Tenant[]> {
  try {
    const client = await createCivisClient();
    const page = await client.tenants.list({ limit: 100 });
    return page.data;
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return [];
  }
}

function statusVariant(s: Tenant["status"]): "active" | "pending" | "inactive" {
  if (s === "ACTIVE") return "active";
  if (s === "SUSPENDED") return "pending";
  return "inactive";
}

export default async function ConsoleTenantsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const tenants = await fetchTenants();

  const active = tenants.filter((t) => t.status === "ACTIVE").length;
  const suspended = tenants.filter((t) => t.status === "SUSPENDED").length;
  const pending = tenants.filter(
    (t) => t.status === "PENDING" || t.status === "ARCHIVED",
  ).length;

  const metrics = [
    { title: "Total tenants", value: String(tenants.length), trend: "flat" as const },
    { title: "Active", value: String(active), trend: "up" as const },
    { title: "Suspended", value: String(suspended), trend: "down" as const },
    { title: "Pending / archived", value: String(pending), trend: "flat" as const },
  ];

  return (
    <ConsolePageShell
      locale={locale}
      breadcrumbLabel="Tenants"
      title="Tenant Directory"
      description="Monitor organization footprint, onboarding progress, and deployment regions."
      action={<Button>Invite tenant</Button>}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.title} {...m} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenants ({tenants.length})</CardTitle>
          <CardDescription>
            Internal registry with current plan and health status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={["Tenant", "Slug", "Plan", "Region", "Status"]}
            rows={tenants.map((t) => ({
              Tenant: t.displayName,
              Slug: t.slug,
              Plan: t.plan,
              Region: t.region,
              Status: <StatusBadge status={statusVariant(t.status)} />,
            }))}
          />
        </CardContent>
      </Card>
    </ConsolePageShell>
  );
}
