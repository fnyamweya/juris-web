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
import { Activity, Building2, Database, ShieldCheck } from "lucide-react";
import Link from "next/link";
import {
  OnboardingAreaChart,
  RegionBarChart,
  TenantStatusChart,
} from "@/components/tenant-charts";
import { requirePermission } from "@repo/auth";
import { ControlPanelShell } from "@/components/control-panel-shell";
import { fetchTenants, statusTone, tenantIdOf } from "@/lib/tenant-data";

export default async function ControlPanelOverviewPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  await requirePermission("control-panel:read", { redirectTo: `/${locale}/console` });

  const tenants = await fetchTenants();

  const active = tenants.filter((tenant) => tenant.status === "ACTIVE").length;
  const provisioning = tenants.filter(
    (tenant) => tenant.status === "PROVISIONING",
  ).length;
  const suspended = tenants.filter(
    (tenant) => tenant.status === "SUSPENDED",
  ).length;
  const separatePlacement = tenants.filter(
    (tenant) => tenant.isolationStrategy !== "SHARED_SCHEMA",
  ).length;

  const statusData = ["ACTIVE", "PROVISIONING", "SUSPENDED", "ARCHIVED"].map(
    (status) => ({
      status,
      count: tenants.filter((tenant) => tenant.status === status).length,
    }),
  );

  const regionData = Object.entries(
    tenants.reduce<Record<string, number>>((acc, tenant) => {
      acc[tenant.region] = (acc[tenant.region] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([region, count]) => ({ region, tenants: count }));

  const activityData = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map(
    (month, index) => ({
      month,
      onboarded: Math.max(1, Math.round((tenants.length + index * 2) / 3)),
      secured: Math.max(1, Math.round((active + index) / 2)),
    }),
  );

  return (
    <ControlPanelShell
      locale={locale}
      breadcrumbLabel="Overview"
      title="Platform Control Panel"
      description="Tenant onboarding, lifecycle risk, auth posture, and platform policy operations in one control plane."
      action={
        <Button asChild>
          <Link href={`/${locale}/control-panel/onboarding`}>Onboard tenant</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total tenants"
          value={String(tenants.length)}
          change={`${active} active`}
          trend="up"
          icon={Building2}
        />
        <MetricCard
          title="Provisioning"
          value={String(provisioning)}
          change="awaiting activation"
          trend={provisioning > 0 ? "flat" : "up"}
          icon={Activity}
        />
        <MetricCard
          title="Suspended"
          value={String(suspended)}
          change="sensitive action gated"
          trend={suspended > 0 ? "down" : "flat"}
          icon={ShieldCheck}
        />
        <MetricCard
          title="Dedicated placement"
          value={String(separatePlacement)}
          change="schema/database isolation"
          trend="flat"
          icon={Database}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lifecycle mix</CardTitle>
            <CardDescription>
              Provisioning and active states by tenant count.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TenantStatusChart data={statusData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onboarding readiness</CardTitle>
            <CardDescription>
              Tenant creation and security hardening trend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingAreaChart data={activityData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Regional footprint</CardTitle>
            <CardDescription>
              Active control-plane footprint by configured region.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegionBarChart data={regionData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent tenants</CardTitle>
            <CardDescription>
              Latest tenants registered through the platform API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={["Tenant", "Region", "Plan", "Status"]}
              rows={tenants.slice(0, 6).map((tenant) => ({
                Tenant: (
                  <Link
                    className="font-medium hover:underline"
                    href={`/${locale}/control-panel/tenants/${tenantIdOf(tenant)}`}
                  >
                    {tenant.displayName}
                  </Link>
                ),
                Region: tenant.region,
                Plan: tenant.plan,
                Status: <StatusBadge status={statusTone(tenant.status)} />,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </ControlPanelShell>
  );
}
