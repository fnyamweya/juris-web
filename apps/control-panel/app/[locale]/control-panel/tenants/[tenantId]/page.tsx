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
  EmptyState,
  MetricCard,
  StatusBadge,
} from "@repo/ui";
import {
  Archive,
  KeyRound,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { ControlPanelShell } from "@/components/control-panel-shell";
import { getControlPanelAccess } from "@/lib/access";
import {
  fetchTenantBundle,
  formatSeconds,
  statusTone,
} from "@/lib/tenant-data";
import {
  assignTenantContext,
  assignTenantRole,
  inviteTenantMember,
  tenantLifecycleAction,
  tenantMemberLifecycleAction,
  updateTenantAuthPolicies,
  upsertPolicyBinding,
} from "../../server-actions";

const inputClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
const areaClass =
  "min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
const labelClass = "grid gap-1.5 text-sm font-medium";

const tabs = [
  ["overview", "Overview"],
  ["members", "Members"],
  ["auth", "Auth Config"],
  ["federation", "Federation"],
  ["placement", "Placement"],
  ["context", "Markets & Orgs"],
  ["policies", "Policies"],
  ["actions", "Actions"],
] as const;

export default async function TenantDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; tenantId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, tenantId } = await params;
  const { tab = "overview" } = await searchParams;
  const access = await getControlPanelAccess();
  if (!access.allowed) {
    return (
      <ControlPanelShell
        locale={locale}
        breadcrumbLabel="Tenant"
        title="Tenant Details"
        description="Tenant configuration, identity, placement, context, and policy controls."
      >
        {null}
      </ControlPanelShell>
    );
  }

  const bundle = await fetchTenantBundle(tenantId);

  if (!bundle) {
    return (
      <ControlPanelShell
        locale={locale}
        breadcrumbLabel="Tenant"
        title="Tenant not available"
        description="The tenant could not be read from the platform API."
      >
        <EmptyState
          title="Tenant unavailable"
          description="Check the tenant id or your platform control permissions."
        />
      </ControlPanelShell>
    );
  }

  const { tenant, authConfig } = bundle;
  const activeTab = tabs.some(([value]) => value === tab) ? tab : "overview";

  return (
    <ControlPanelShell
      locale={locale}
      breadcrumbLabel={tenant.displayName}
      title={tenant.displayName}
      description={`${tenant.tenantId} · ${tenant.plan} · ${tenant.region}`}
      action={<LifecycleButtons locale={locale} tenantId={tenantId} status={tenant.status} />}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Lifecycle" value={tenant.status} trend="flat" />
        <MetricCard
          title="MFA mode"
          value={authConfig?.mfaPolicy.mode ?? "n/a"}
          trend={authConfig?.mfaRequired ? "up" : "flat"}
          icon={ShieldCheck}
        />
        <MetricCard
          title="Access token TTL"
          value={formatSeconds(authConfig?.accessTokenTtlSeconds)}
          trend="flat"
          icon={KeyRound}
        />
        <MetricCard
          title="Members"
          value={String(bundle.members.length)}
          trend="up"
          icon={UserPlus}
        />
      </div>

      <nav className="flex gap-2 overflow-x-auto border-b pb-2">
        {tabs.map(([value, label]) => (
          <Button
            key={value}
            variant={activeTab === value ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link href={`/${locale}/control-panel/tenants/${tenantId}?tab=${value}`}>
              {label}
            </Link>
          </Button>
        ))}
      </nav>

      {activeTab === "overview" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Configuration</CardTitle>
              <CardDescription>Registry fields returned by the tenant API.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <KeyValue label="Tenant id" value={tenant.tenantId} />
                <KeyValue label="Plan" value={tenant.plan} />
                <KeyValue label="Region" value={tenant.region} />
                <KeyValue label="Isolation" value={tenant.isolationStrategy} />
                <KeyValue label="Created" value={tenant.createdAt} />
                <KeyValue label="Updated" value={tenant.updatedAt} />
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Effective Auth Posture</CardTitle>
              <CardDescription>
                Derived controls from tenant config and policy rules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <KeyValue
                  label="Requires MFA"
                  value={String(bundle.effectiveAuthConfig?.requiresMfa ?? false)}
                />
                <KeyValue
                  label="Privileged MFA"
                  value={String(
                    bundle.effectiveAuthConfig?.privilegedRolesRequireMfa ?? false,
                  )}
                />
                <KeyValue
                  label="Sources"
                  value={String(bundle.effectiveAuthConfig?.sources.length ?? 0)}
                />
                <KeyValue
                  label="Federated providers"
                  value={String(authConfig?.externalIdentityProviders.length ?? 0)}
                />
              </dl>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "members" ? (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Invite Tenant Member</CardTitle>
              <CardDescription>
                Uses the register tenant member endpoint with initial roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={inviteTenantMember} className="grid gap-3 md:grid-cols-5">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="tenantId" value={tenantId} />
                <input className={inputClass} name="email" type="email" placeholder="Email" required />
                <input className={inputClass} name="displayName" placeholder="Display name" />
                <input
                  className={inputClass}
                  name="identityProviderSubject"
                  placeholder="Identity subject"
                />
                <input className={inputClass} name="roles" defaultValue="TENANT_MEMBER" />
                <Button type="submit">Invite</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Lifecycle and sensitive role assignment controls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={["Member", "Roles", "Status", "Role action", "Lifecycle"]}
                rows={bundle.members.map((member) => ({
                  Member: (
                    <div>
                      <p className="font-medium">{member.displayName}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  ),
                  Roles: (
                    <div className="flex flex-wrap gap-1">
                      {member.roles.map((role) => (
                        <Badge key={role} variant="secondary">{role}</Badge>
                      ))}
                    </div>
                  ),
                  Status: <StatusBadge status={statusTone(member.status)} />,
                  "Role action": (
                    <form action={assignTenantRole} className="flex gap-2">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="tenantId" value={tenantId} />
                      <input type="hidden" name="userId" value={member.userId} />
                      <input className={inputClass} name="roleId" placeholder="TENANT_ADMIN" />
                      <Button type="submit" variant="outline" size="sm">Assign</Button>
                    </form>
                  ),
                  Lifecycle: (
                    <div className="flex flex-wrap gap-2">
                      {["activate", "suspend", "remove"].map((action) => (
                        <form key={action} action={tenantMemberLifecycleAction}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="tenantId" value={tenantId} />
                          <input type="hidden" name="userId" value={member.userId} />
                          <input type="hidden" name="action" value={action} />
                          <Button type="submit" variant="outline" size="sm">
                            {action}
                          </Button>
                        </form>
                      ))}
                    </div>
                  ),
                }))}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "auth" ? (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Patch MFA And Session Policy</CardTitle>
              <CardDescription>
                Calls the tenant MFA and session patch endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateTenantAuthPolicies} className="grid gap-3">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="tenantId" value={tenantId} />
                <label className={labelClass}>
                  MFA mode
                  <select
                    className={inputClass}
                    name="mfaMode"
                    defaultValue={authConfig?.mfaPolicy.mode ?? "OFF"}
                  >
                    <option value="OFF">Off</option>
                    <option value="REQUIRED_FOR_ALL">Required for all</option>
                    <option value="ROLE_BASED">Role based</option>
                    <option value="ADAPTIVE">Adaptive</option>
                  </select>
                </label>
                <label className={labelClass}>
                  Allowed methods
                  <input
                    className={inputClass}
                    name="allowedMethods"
                    defaultValue={authConfig?.mfaPolicy.allowedMethods?.join(",") ?? "TOTP,WEBAUTHN"}
                  />
                </label>
                <label className={labelClass}>
                  MFA max age
                  <input
                    className={inputClass}
                    type="number"
                    name="mfaMaxAgeSeconds"
                    defaultValue={authConfig?.mfaPolicy.maxAgeSeconds ?? 300}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="stepUpForSensitiveActions"
                    defaultChecked={authConfig?.mfaPolicy.stepUpForSensitiveActions ?? true}
                  />
                  Step-up sensitive actions
                </label>
                <label className={labelClass}>
                  Idle session timeout
                  <input
                    className={inputClass}
                    type="number"
                    name="idleSessionTimeoutSeconds"
                    defaultValue={authConfig?.sessionPolicy.idleSessionTimeoutSeconds ?? 3600}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="refreshTokenRotationEnabled"
                    defaultChecked={authConfig?.sessionPolicy.refreshTokenRotationEnabled ?? true}
                  />
                  Refresh token rotation
                </label>
                <Button type="submit">Save policy patches</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Auth Config Versions</CardTitle>
              <CardDescription>
                Recent auth policy revisions and risk summaries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={["Version", "Status", "Risk", "Reason", "Created"]}
                rows={bundle.authRevisions.map((revision) => ({
                  Version: revision.version,
                  Status: revision.status,
                  Risk: revision.riskLevel ?? "n/a",
                  Reason: revision.changeReason ?? "n/a",
                  Created: revision.createdAt,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "federation" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {(authConfig?.externalIdentityProviders ?? []).map((provider) => {
            const setup = bundle.providerSetups.find(
              (item) => item.providerKey === provider.providerKey,
            );
            return (
              <Card key={provider.providerKey}>
                <CardHeader>
                  <CardTitle>{provider.displayName}</CardTitle>
                  <CardDescription>
                    {provider.protocol} · {provider.type} · {provider.providerKey}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <KeyValue label="Enabled" value={String(provider.enabled)} />
                  <KeyValue label="Issuer" value={provider.issuerUri ?? "n/a"} />
                  <KeyValue label="Client" value={provider.clientId ?? "n/a"} />
                  <KeyValue label="Setup status" value={setup?.status ?? "n/a"} />
                  <KeyValue label="Login URL" value={setup?.loginUrl ?? "n/a"} />
                  <KeyValue label="ACS URL" value={setup?.acsUrl ?? "n/a"} />
                  <KeyValue
                    label="Allowed domains"
                    value={provider.allowedDomains?.join(", ") || "n/a"}
                  />
                </CardContent>
              </Card>
            );
          })}
          {!authConfig?.externalIdentityProviders.length ? (
            <EmptyState
              title="No federated providers"
              description="Add a provider during onboarding or through the auth-config API."
            />
          ) : null}
        </div>
      ) : null}

      {activeTab === "placement" ? (
        <Card>
          <CardHeader>
            <CardTitle>Placement</CardTitle>
            <CardDescription>Tenant placement and migration state.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <KeyValue label="Placement id" value={bundle.placement?.placementId ?? "n/a"} />
              <KeyValue label="Strategy" value={bundle.placement?.strategy ?? tenant.isolationStrategy} />
              <KeyValue label="Database group" value={bundle.placement?.databaseGroup ?? "n/a"} />
              <KeyValue label="Database name" value={bundle.placement?.databaseName ?? "n/a"} />
              <KeyValue label="Schema" value={bundle.placement?.schemaName ?? "n/a"} />
              <KeyValue label="Datasource" value={bundle.placement?.datasourceKey ?? "n/a"} />
              <KeyValue label="Migration version" value={bundle.placement?.migrationVersion ?? "n/a"} />
              <KeyValue label="Status" value={bundle.placement?.status ?? "n/a"} />
            </dl>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "context" ? (
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle>Assign Context</CardTitle>
              <CardDescription>
                Idempotently assign tenant market and organization context.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={assignTenantContext} className="grid gap-3">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="tenantId" value={tenantId} />
                <input className={inputClass} name="marketCode" placeholder="Market code" />
                <select className={inputClass} name="marketAssignmentType" defaultValue="OPERATING">
                  <option value="HOME">Home</option>
                  <option value="OPERATING">Operating</option>
                </select>
                <input className={inputClass} name="organizationId" placeholder="Organization UUID" />
                <select
                  className={inputClass}
                  name="organizationRelationshipType"
                  defaultValue="OPERATING"
                >
                  <option value="OWNER">Owner</option>
                  <option value="BILLING">Billing</option>
                  <option value="OPERATING">Operating</option>
                </select>
                <Button type="submit">Assign context</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Resolved Context</CardTitle>
              <CardDescription>
                Market, jurisdiction, country, and organization projection.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <KeyValue label="Home market" value={bundle.marketContext?.homeMarketCode ?? "n/a"} />
              <KeyValue
                label="Operating markets"
                value={bundle.marketContext?.operatingMarketCodes.join(", ") || "n/a"}
              />
              <KeyValue
                label="Jurisdictions"
                value={bundle.marketContext?.jurisdictionCodes.join(", ") || "n/a"}
              />
              <KeyValue
                label="Countries"
                value={bundle.marketContext?.countryCodes.join(", ") || "n/a"}
              />
              <KeyValue
                label="Owner organization"
                value={bundle.organizationContext?.ownerOrganizationId ?? "n/a"}
              />
              <KeyValue
                label="Billing organization"
                value={bundle.organizationContext?.billingOrganizationId ?? "n/a"}
              />
              <KeyValue
                label="Operating organizations"
                value={bundle.organizationContext?.operatingOrganizationIds.join(", ") || "n/a"}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "policies" ? (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Seed Tenant Policy Binding</CardTitle>
              <CardDescription>
                Upsert a scoped binding and let maker-checker handle sensitive policy changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={upsertPolicyBinding} className="grid gap-3">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="tenantId" value={tenantId} />
                <input className={inputClass} name="policyKind" placeholder="PRODUCT_AVAILABILITY" />
                <input className={inputClass} name="policyKey" placeholder="tenant-launch" />
                <input className={inputClass} name="scopeKind" defaultValue="TENANT" />
                <input className={inputClass} name="scopeRef" defaultValue={tenantId} />
                <input className={inputClass} type="number" name="schemaVersion" defaultValue={1} />
                <select className={inputClass} name="effect" defaultValue="APPLY">
                  <option value="APPLY">Apply</option>
                  <option value="ENABLE">Enable</option>
                  <option value="DISABLE">Disable</option>
                  <option value="REQUIRE">Require</option>
                  <option value="FORBID">Forbid</option>
                </select>
                <textarea
                  className={areaClass}
                  name="policyValue"
                  defaultValue={'{"enabled":true}'}
                />
                <Button type="submit">Upsert binding</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Policy Cache</CardTitle>
              <CardDescription>
                Operator cache stats from the policy endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs">
                {JSON.stringify(bundle.policyCache ?? {}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "actions" ? (
        <Card>
          <CardHeader>
            <CardTitle>Available Tenant Actions</CardTitle>
            <CardDescription>
              Actions currently wired through the platform control panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={["Feature", "Endpoint", "Status"]}
              rows={[
                ["Lifecycle", "activate / suspend / archive", "Wired"],
                ["Members", "create / lifecycle / role.assign", "Wired"],
                ["Auth config", "preview / update / patch / versions", "Wired"],
                ["Federation", "setup / provider config / mapping preview", "Read + setup"],
                ["Placement", "placement read", "Wired"],
                ["Markets", "assign / unassign / context", "Assign + read"],
                ["Organizations", "assign / unassign / context", "Assign + read"],
                ["Policies", "bindings / cache / resolution", "Upsert + stats"],
              ].map(([feature, endpoint, status]) => ({
                Feature: feature,
                Endpoint: endpoint,
                Status: <Badge variant="success">{status}</Badge>,
              }))}
            />
          </CardContent>
        </Card>
      ) : null}
    </ControlPanelShell>
  );
}

function LifecycleButtons({
  locale,
  tenantId,
  status,
}: {
  locale: Locale;
  tenantId: string;
  status: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "ACTIVE" ? (
        <LifecycleForm locale={locale} tenantId={tenantId} action="activate" icon="activate" />
      ) : null}
      {status === "ACTIVE" ? (
        <LifecycleForm locale={locale} tenantId={tenantId} action="suspend" icon="suspend" />
      ) : null}
      {status !== "ARCHIVED" ? (
        <LifecycleForm locale={locale} tenantId={tenantId} action="archive" icon="archive" />
      ) : null}
    </div>
  );
}

function LifecycleForm({
  locale,
  tenantId,
  action,
  icon,
}: {
  locale: Locale;
  tenantId: string;
  action: string;
  icon: "activate" | "suspend" | "archive";
}) {
  const Icon = icon === "activate" ? PlayCircle : icon === "suspend" ? PauseCircle : Archive;
  return (
    <form action={tenantLifecycleAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="action" value={action} />
      <Button
        type="submit"
        variant={action === "archive" ? "danger" : "outline"}
      >
        <Icon className="h-4 w-4" />
        {action}
      </Button>
    </form>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg border p-3">
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="break-words font-medium">{value}</dd>
    </div>
  );
}
