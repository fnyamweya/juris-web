import type { Locale } from "@repo/i18n";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
} from "@repo/ui";
import { requirePermission } from "@repo/auth";
import { ControlPanelShell } from "@/components/control-panel-shell";
import { tenantApiActions } from "@/lib/tenant-actions";

export default async function ActionsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  await requirePermission("control-panel:read", { redirectTo: `/${locale}/console` });

  return (
    <ControlPanelShell
      locale={locale}
      breadcrumbLabel="API Actions"
      title="Tenant API Actions"
      description="Endpoint-backed action map for tenant onboarding, lifecycle, identity, auth config, context, and policy controls."
    >
      <Card>
        <CardHeader>
          <CardTitle>Action Coverage</CardTitle>
          <CardDescription>
            Every row is backed by the shared Civis API client and surfaced in the control panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={["Group", "Action", "Method", "Endpoint", "UI"]}
            rows={tenantApiActions.map((action) => ({
              Group: <Badge variant="secondary">{action.group}</Badge>,
              Action: action.action,
              Method: <Badge variant="outline">{action.method}</Badge>,
              Endpoint: (
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {action.path}
                </code>
              ),
              UI: action.ui,
            }))}
          />
        </CardContent>
      </Card>
    </ControlPanelShell>
  );
}
