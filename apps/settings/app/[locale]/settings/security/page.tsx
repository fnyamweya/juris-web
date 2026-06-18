import type { Locale } from "@repo/i18n";
import { CivisApiError, createCivisClient } from "@repo/civis";
import type { ActiveSession, TenantAuthConfig, TrustedDevice } from "@repo/civis";
import { getEnv } from "@repo/platform";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { ShieldCheck } from "lucide-react";
import { MyAccountPageShell } from "@/components/my-account-page-shell";
import { ChangePasswordForm } from "./change-password-form";
import { SessionsList } from "./sessions-list";
import { TotpSection } from "./totp-section";
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

async function fetchTotpStatus(): Promise<{ enrolled: boolean; enrolledAt: string | null }> {
  try {
    const casUrl = getEnv("CAS_ISSUER_URL") ?? "http://localhost:9000";
    const res = await fetch(`${casUrl}/mfa/totp/status`, { cache: "no-store" });
    if (!res.ok) return { enrolled: false, enrolledAt: null };
    return res.json() as Promise<{ enrolled: boolean; enrolledAt: string | null }>;
  } catch {
    return { enrolled: false, enrolledAt: null };
  }
}

export default async function SettingsSecurityPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  const [{ authConfig, sessions, trustedDevices }, totpStatus] =
    await Promise.all([
      fetchSecurityData(undefined),
      fetchTotpStatus(),
    ]);

  const mfaMode = authConfig?.mfaPolicy?.mode;

  return (
    <MyAccountPageShell
      locale={locale}
      breadcrumbLabel="Security & Sign In"
      title="Security & Sign In"
      description="Authenticator app, active sessions, trusted devices, and your organisation's authentication policy."
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-muted-foreground" />
              <CardTitle>Password</CardTitle>
            </div>
            <CardDescription>
              Choose a strong password you don&apos;t use anywhere else.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-muted-foreground" />
              <CardTitle>Authenticator app (TOTP)</CardTitle>
            </div>
            <CardDescription>
              Time-based one-time passwords via Google Authenticator, Authy, or
              any TOTP-compatible app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TotpSection initial={totpStatus} />
          </CardContent>
        </Card>

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
                    authConfig.externalIdentityProviders?.length
                      ? `${authConfig.externalIdentityProviders.length} configured`
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

        <Card>
          <CardHeader>
            <CardTitle>Active sessions</CardTitle>
            <CardDescription>
              All devices currently signed in to your account. Revoking a
              session signs that device out immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionsList locale={locale} sessions={sessions} />
          </CardContent>
        </Card>

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
      </div>
    </MyAccountPageShell>
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

function fmtMinutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  return m >= 60 ? `${Math.round(m / 60)}h` : `${m} min`;
}

function fmtSeconds(seconds: number): string {
  return seconds >= 60 ? `${Math.round(seconds / 60)} min` : `${seconds}s`;
}
