import type { Locale } from "@repo/i18n";
import { requirePermission } from "@repo/auth";
import { CivisApiError, createCivisClient } from "@repo/civis";
import type { ActiveSession, TenantAuthConfig, TrustedDevice } from "@repo/civis";
import {
  AppShell,
  Badge,
  Breadcrumb,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from "@repo/ui";
import { ShieldCheck } from "lucide-react";
import { getSettingsBreadcrumb, getSettingsNavItems } from "@/lib/navigation";
import { SessionsList } from "./sessions-list";
import { TrustedDevicesList } from "./trusted-devices-list";

async function fetchSecurityData(tenantId: string | undefined) {
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
  const { authConfig, sessions, trustedDevices } = await fetchSecurityData(tenantId);
  const mfaMode = authConfig?.mfaPolicy?.mode;

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
        description="Active sessions, trusted devices, and your organisation's authentication policy."
      />

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Org auth policy — read-only overview */}
        {authConfig && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <CardTitle>Organisation authentication policy</CardTitle>
              </div>
              <CardDescription>
                Set by your organisation administrator. Contact them to make
                changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                <PolicyItem
                  label="MFA enforcement"
                  value={
                    mfaMode === "REQUIRED_FOR_ALL"
                      ? "Required for all"
                      : mfaMode === "ROLE_BASED"
                        ? "Role-based"
                        : mfaMode === "ADAPTIVE"
                          ? "Adaptive"
                          : "Off"
                  }
                  highlight={mfaMode === "REQUIRED_FOR_ALL" || mfaMode === "ROLE_BASED"}
                />
                <PolicyItem
                  label="Password policy"
                  value={authConfig.passwordPolicy ?? "STANDARD"}
                />
                <PolicyItem
                  label="Session idle timeout"
                  value={
                    authConfig.sessionPolicy?.idleSessionTimeoutSeconds
                      ? fmtMinutes(authConfig.sessionPolicy.idleSessionTimeoutSeconds)
                      : "Default"
                  }
                />
                <PolicyItem
                  label="Local password login"
                  value={authConfig.localPasswordEnabled ? "Enabled" : "Disabled"}
                />
                <PolicyItem
                  label="SSO providers"
                  value={
                    authConfig.externalProviders?.length
                      ? `${authConfig.externalProviders.length} configured`
                      : "None"
                  }
                />
                {authConfig.sessionPolicy?.warningBeforeTimeoutSeconds !== undefined && (
                  <PolicyItem
                    label="Lock warning"
                    value={fmtSeconds(authConfig.sessionPolicy.warningBeforeTimeoutSeconds)}
                  />
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Active sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Active sessions</CardTitle>
            <CardDescription>
              All devices currently signed in to your account. Revoking a
              session signs that device out immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionsList
              locale={locale}
              sessions={sessions}
              // No server-side way to know which handle maps to this request,
              // so we pass undefined — sessions show without "current" badge.
            />
          </CardContent>
        </Card>

        {/* Trusted devices */}
        <Card>
          <CardHeader>
            <CardTitle>Trusted devices</CardTitle>
            <CardDescription>
              After completing MFA on a trusted device, the MFA step is skipped
              for the trust period you set in Preferences. Remove a device to
              require MFA on next sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrustedDevicesList locale={locale} devices={trustedDevices} />
          </CardContent>
        </Card>

        {/* Enrolled MFA methods — informational */}
        <Card>
          <CardHeader>
            <CardTitle>Enrolled MFA methods</CardTitle>
            <CardDescription>
              Methods available on your account. Set your preferred method in{" "}
              <a
                href={`/${locale}/settings/preferences`}
                className="underline underline-offset-2"
              >
                Preferences
              </a>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <MfaMethodRow
              label="Authenticator app (TOTP)"
              description="Time-based one-time passwords via Google Authenticator or Authy."
            />
            <MfaMethodRow
              label="Passkey or security key (WebAuthn / FIDO2)"
              description="Biometric authentication or a hardware security key."
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function PolicyItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>
        <Badge variant={highlight ? "default" : "outline"} className="text-xs">
          {value}
        </Badge>
      </dd>
    </div>
  );
}

function MfaMethodRow({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function fmtMinutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  return m >= 60 ? `${Math.round(m / 60)}h` : `${m} min`;
}

function fmtSeconds(seconds: number): string {
  return seconds >= 60 ? `${Math.round(seconds / 60)} min` : `${seconds}s`;
}
