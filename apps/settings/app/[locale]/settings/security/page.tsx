import type { Locale } from "@repo/i18n";
import { requirePermission } from "@repo/auth";
import { CivisApiError, createCivisClient } from "@repo/civis";
import type {
  ActiveSession,
  TenantAuthConfig,
  TrustedDevice,
} from "@repo/civis";
import {
  AppShell,
  Badge,
  Breadcrumb,
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
import { getSettingsBreadcrumb, getSettingsNavItems } from "@/lib/navigation";

async function fetchAll(tenantId: string | undefined) {
  try {
    const client = await createCivisClient(tenantId);
    const [authConfig, sessions, trustedDevices] = await Promise.all([
      tenantId
        ? client.authConfig.get(tenantId).catch(() => null as TenantAuthConfig | null)
        : Promise.resolve(null as TenantAuthConfig | null),
      client.me.security.sessions.list().catch(() => [] as ActiveSession[]),
      client.me.security.trustedDevices.list().catch(() => [] as TrustedDevice[]),
    ]);
    return { authConfig, sessions, trustedDevices };
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return { authConfig: null, sessions: [], trustedDevices: [] };
  }
}

export default async function SettingsSecurityPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await requirePermission("settings:read", {
    redirectTo: `/${locale}/console`,
  });
  const tenantId = session.currentTenant?.id;
  const { authConfig, sessions, trustedDevices } = await fetchAll(tenantId);

  return (
    <AppShell
      appName="Settings"
      navItems={getSettingsNavItems(locale)}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      logoutUrl={`/api/auth/logout?locale=${locale}`}
      breadcrumb={<Breadcrumb items={getSettingsBreadcrumb(locale, "Security")} />}
    >
      <PageHeader
        title="Security"
        description="MFA policy, active sessions, trusted devices, and identity federation."
      />

      <div className="grid gap-6">
        {/* MFA & Session policy (tenant-level, read-only here) */}
        {authConfig && (
          <Card>
            <CardHeader>
              <CardTitle>Authentication policy</CardTitle>
              <CardDescription>
                Configured by your organisation administrator.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <PolicyRow
                label="MFA enforcement"
                value={
                  authConfig.mfaPolicy?.mode === "REQUIRED_FOR_ALL"
                    ? "Required for all"
                    : authConfig.mfaPolicy?.mode === "ROLE_BASED"
                      ? "Role-based"
                      : authConfig.mfaPolicy?.mode === "ADAPTIVE"
                        ? "Adaptive"
                        : "Off"
                }
              />
              <PolicyRow
                label="Password policy"
                value={authConfig.passwordPolicy ?? "STANDARD"}
              />
              <PolicyRow
                label="Session idle timeout"
                value={
                  authConfig.sessionPolicy?.idleSessionTimeoutSeconds
                    ? `${Math.round(authConfig.sessionPolicy.idleSessionTimeoutSeconds / 60)} min`
                    : "Default"
                }
              />
              <PolicyRow
                label="Local password login"
                value={authConfig.localPasswordEnabled ? "Enabled" : "Disabled"}
              />
              <PolicyRow
                label="SSO / federation"
                value={
                  authConfig.externalProviders && authConfig.externalProviders.length > 0
                    ? `${authConfig.externalProviders.length} provider(s)`
                    : "None configured"
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Active sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Active sessions</CardTitle>
            <CardDescription>
              All devices currently signed in. Revoke a session to sign out
              that device immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <EmptyState
                title="No active sessions"
                description="No other active sessions found."
              />
            ) : (
              <DataTable
                columns={[
                  "Device / IP",
                  "Tenant",
                  "Auth methods",
                  "Last active",
                  "Expires",
                ]}
                rows={sessions.map((s) => ({
                  "Device / IP": s.clientIp ?? "—",
                  Tenant: s.tenantId ?? "Platform",
                  "Auth methods": (s.amr ?? []).join(", ") || "password",
                  "Last active": s.lastActivityAt
                    ? new Date(s.lastActivityAt).toLocaleString()
                    : "—",
                  Expires: s.absoluteExpiresAt
                    ? new Date(s.absoluteExpiresAt).toLocaleDateString()
                    : "—",
                }))}
              />
            )}
          </CardContent>
        </Card>

        {/* Trusted devices */}
        <Card>
          <CardHeader>
            <CardTitle>Trusted devices</CardTitle>
            <CardDescription>
              Devices that can bypass the MFA step for the configured trust
              period. Remove a device to require MFA on next sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trustedDevices.length === 0 ? (
              <EmptyState
                title="No trusted devices"
                description="No trusted devices are registered. Enable device trust in Preferences."
              />
            ) : (
              <DataTable
                columns={["Label", "Trusted since", "Expires", "Last seen"]}
                rows={trustedDevices.map((d) => ({
                  Label: d.label,
                  "Trusted since": new Date(d.trustedAt).toLocaleDateString(),
                  Expires: new Date(d.expiresAt).toLocaleDateString(),
                  "Last seen": d.lastSeenAt
                    ? new Date(d.lastSeenAt).toLocaleString()
                    : "—",
                }))}
              />
            )}
          </CardContent>
        </Card>

        {/* MFA credentials summary */}
        <Card>
          <CardHeader>
            <CardTitle>Enrolled MFA methods</CardTitle>
            <CardDescription>
              Authentication methods available for your account. Configure
              your preferred method in Preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Authenticator app (TOTP)</p>
                <p className="text-xs text-muted-foreground">
                  Time-based one-time passwords via Google Authenticator or similar.
                </p>
              </div>
              <StatusBadge status="pending" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Passkey / Security key</p>
                <p className="text-xs text-muted-foreground">
                  FIDO2 / WebAuthn — biometric or hardware key authentication.
                </p>
              </div>
              <StatusBadge status="pending" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <Badge variant="outline" className="text-xs">
        {value}
      </Badge>
    </div>
  );
}
