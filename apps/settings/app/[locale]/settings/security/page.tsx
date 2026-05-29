import type { Locale } from "@repo/i18n";
import { getMessages } from "@repo/i18n";
import { getSession } from "@repo/auth";
import { createCivisClient, CivisApiError } from "@repo/civis";
import type { TenantAuthConfig } from "@repo/civis";
import {
  AppShell,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@repo/ui";
import { PermissionGate } from "@repo/ui/permission-gate";
import { createTranslator } from "next-intl";

const NAV = (locale: string) => [
  { label: "Console", href: `/${locale}/console`, permission: "console:read" },
  { label: "Admin", href: `/${locale}/admin`, permission: "admin:read" },
  { label: "Billing", href: `/${locale}/billing`, permission: "billing:read" },
  { label: "Reports", href: `/${locale}/reports`, permission: "reporting:read" },
  { label: "Settings", href: `/${locale}/settings`, permission: "settings:read" },
  { label: "Support", href: `/${locale}/support`, permission: "support:read" },
];

async function fetchAuthConfig(tenantId: string): Promise<TenantAuthConfig | null> {
  try {
    const client = await createCivisClient(tenantId);
    return await client.authConfig.get(tenantId);
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return null;
  }
}

export default async function SettingsSecurityPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages });
  const session = await getSession();
  const tenantId = session.currentTenant?.id;
  const authConfig = tenantId ? await fetchAuthConfig(tenantId) : null;

  return (
    <AppShell
      appName="Settings"
      navItems={NAV(locale)}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      logoutUrl={`/api/auth/logout?locale=${locale}`}
      breadcrumb={
        <Breadcrumb
          items={[
            { label: "Juris", href: `/${locale}` },
            { label: "Settings", href: `/${locale}/settings` },
            { label: "Security" },
          ]}
        />
      }
    >
      <PermissionGate
        session={session}
        permission="settings:read"
        fallback={
          <EmptyState
            title="Access denied"
            description="You need the settings:read permission to view security settings."
          />
        }
      >
        <PageHeader
          title="Security"
          description="Authentication policy, MFA enforcement, and identity federation."
          actions={<Button variant="outline">{t("common.search")}</Button>}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>MFA policy</CardTitle>
              <CardDescription>
                Multi-factor authentication requirements for this tenant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authConfig ? (
                <DataTable
                  columns={["Setting", "Value"]}
                  rows={[
                    { Setting: "Mode", Value: authConfig.mfaPolicy.mode },
                    {
                      Setting: "Max age (s)",
                      Value: String(authConfig.mfaPolicy.maxAgeSeconds ?? "—"),
                    },
                    {
                      Setting: "Allowed methods",
                      Value:
                        authConfig.mfaPolicy.allowedMethods?.join(", ") ?? "—",
                    },
                  ]}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No auth config found for this tenant.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session policy</CardTitle>
              <CardDescription>
                Token rotation and session timeout settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authConfig ? (
                <DataTable
                  columns={["Setting", "Value"]}
                  rows={[
                    {
                      Setting: "Refresh token rotation",
                      Value: authConfig.sessionPolicy.refreshTokenRotationEnabled
                        ? "Enabled"
                        : "Disabled",
                    },
                    {
                      Setting: "Idle timeout (s)",
                      Value: String(
                        authConfig.sessionPolicy.idleSessionTimeoutSeconds ?? "—",
                      ),
                    },
                    {
                      Setting: "Absolute timeout (s)",
                      Value: String(
                        authConfig.sessionPolicy.absoluteSessionTimeoutSeconds ?? "—",
                      ),
                    },
                  ]}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No session policy configured.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Identity providers</CardTitle>
            <CardDescription>
              Federated OIDC and SAML2 providers configured for this tenant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authConfig?.federatedProviders.length ? (
              <DataTable
                columns={["Key", "Type", "Protocol", "Domains", "Status"]}
                rows={authConfig.federatedProviders.map((p) => ({
                  Key: p.providerKey,
                  Type: p.type,
                  Protocol: p.protocol,
                  Domains: p.allowedDomains?.join(", ") ?? "—",
                  Status: (
                    <StatusBadge
                      status={p.enabled ? "active" : "inactive"}
                    />
                  ),
                }))}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No identity providers configured. Add Google, Microsoft, or a
                custom OIDC/SAML2 provider to enable enterprise SSO.
              </p>
            )}
          </CardContent>
        </Card>
      </PermissionGate>
    </AppShell>
  );
}
