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
import { Archive, PauseCircle, PlayCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import { requirePermission } from "@repo/auth";
import { ControlPanelShell } from "@/components/control-panel-shell";
import { fetchTenants, statusTone, tenantIdOf } from "@/lib/tenant-data";
import { tenantLifecycleAction } from "../server-actions";

export default async function ControlPanelTenantsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  await requirePermission("control-panel:read", { redirectTo: `/${locale}/console` });

  const tenants = await fetchTenants();

  const counts = {
    active: tenants.filter((tenant) => tenant.status === "ACTIVE").length,
    provisioning: tenants.filter((tenant) => tenant.status === "PROVISIONING").length,
    suspended: tenants.filter((tenant) => tenant.status === "SUSPENDED").length,
    archived: tenants.filter((tenant) => tenant.status === "ARCHIVED").length,
  };

  return (
    <ControlPanelShell
      locale={locale}
      breadcrumbLabel="Tenants"
      title="Tenant Directory"
      description="Create, inspect, activate, suspend, archive, and govern tenants from the platform API."
      action={
        <Button asChild>
          <Link href={`/${locale}/control-panel/onboarding`}>Onboard tenant</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Active" value={String(counts.active)} trend="up" />
        <MetricCard
          title="Provisioning"
          value={String(counts.provisioning)}
          trend="flat"
        />
        <MetricCard
          title="Suspended"
          value={String(counts.suspended)}
          trend="down"
        />
        <MetricCard title="Archived" value={String(counts.archived)} trend="flat" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenants ({tenants.length})</CardTitle>
          <CardDescription>
            Lifecycle actions map to activate, suspend, and archive endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              "Tenant",
              "Plan",
              "Region",
              "Isolation",
              "Status",
              "Actions",
            ]}
            rows={tenants.map((tenant) => {
              const tenantId = tenantIdOf(tenant);
              return {
                Tenant: (
                  <Link
                    href={`/${locale}/control-panel/tenants/${tenantId}`}
                    className="font-medium hover:underline"
                  >
                    {tenant.displayName}
                  </Link>
                ),
                Plan: tenant.plan,
                Region: tenant.region,
                Isolation: tenant.isolationStrategy,
                Status: <StatusBadge status={statusTone(tenant.status)} />,
                Actions: (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${locale}/control-panel/tenants/${tenantId}`}>
                        Details
                      </Link>
                    </Button>
                    <Button variant="secondary" size="sm" asChild>
                      <Link
                        href={`/${locale}/control-panel/tenants/${tenantId}?tab=members`}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Invite
                      </Link>
                    </Button>
                    {tenant.status !== "ACTIVE" ? (
                      <form action={tenantLifecycleAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="tenantId" value={tenantId} />
                        <input type="hidden" name="action" value="activate" />
                        <Button type="submit" variant="outline" size="sm">
                          <PlayCircle className="h-3.5 w-3.5" />
                          Activate
                        </Button>
                      </form>
                    ) : null}
                    {tenant.status === "ACTIVE" ? (
                      <form action={tenantLifecycleAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="tenantId" value={tenantId} />
                        <input type="hidden" name="action" value="suspend" />
                        <Button type="submit" variant="outline" size="sm">
                          <PauseCircle className="h-3.5 w-3.5" />
                          Suspend
                        </Button>
                      </form>
                    ) : null}
                    {tenant.status !== "ARCHIVED" ? (
                      <form action={tenantLifecycleAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="tenantId" value={tenantId} />
                        <input type="hidden" name="action" value="archive" />
                        <Button type="submit" variant="danger" size="sm">
                          <Archive className="h-3.5 w-3.5" />
                          Archive
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ),
              };
            })}
          />
        </CardContent>
      </Card>
    </ControlPanelShell>
  );
}
