import type { Locale } from "@repo/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { ControlPanelShell } from "@/components/control-panel-shell";
import { getControlPanelAccess } from "@/lib/access";
import { onboardTenant } from "../server-actions";

const inputClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
const areaClass =
  "min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
const labelClass = "grid gap-1.5 text-sm font-medium";
const hintClass = "text-xs font-normal text-muted-foreground";

export default async function TenantOnboardingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const access = await getControlPanelAccess("control-panel:write");
  if (!access.allowed) {
    return (
      <ControlPanelShell
        locale={locale}
        breadcrumbLabel="Onboard Tenant"
        title="Onboard Tenant"
        description="Register the tenant, placement, owner invitation, auth policy, federation, market/org context, and policy seeds in one controlled flow."
        permission="control-panel:write"
      >
        {null}
      </ControlPanelShell>
    );
  }

  return (
    <ControlPanelShell
      locale={locale}
      breadcrumbLabel="Onboard Tenant"
      title="Onboard Tenant"
      description="Register the tenant, placement, owner invitation, auth policy, federation, market/org context, and policy seeds in one controlled flow."
      permission="control-panel:write"
    >
      <form action={onboardTenant} className="grid gap-4">
        <input type="hidden" name="locale" value={locale} />

        <Card>
          <CardHeader>
            <CardTitle>Tenant Config</CardTitle>
            <CardDescription>
              Core tenant identity, region, commercial plan, and data isolation.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className={labelClass}>
              Display name
              <input className={inputClass} name="displayName" required />
            </label>
            <label className={labelClass}>
              Tenant ULID
              <input className={inputClass} name="tenantId" placeholder="Optional" />
            </label>
            <label className={labelClass}>
              Region
              <input className={inputClass} name="region" defaultValue="local" />
            </label>
            <label className={labelClass}>
              Plan
              <input className={inputClass} name="plan" defaultValue="STANDARD" />
            </label>
            <label className={labelClass}>
              Isolation strategy
              <select
                className={inputClass}
                name="isolationStrategy"
                defaultValue="SHARED_SCHEMA"
              >
                <option value="SHARED_SCHEMA">Shared schema</option>
                <option value="SEPARATE_SCHEMA">Separate schema</option>
                <option value="SEPARATE_DATABASE">Separate database</option>
              </select>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Placement</CardTitle>
            <CardDescription>
              Initial placement metadata used by runtime tenant routing.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className={labelClass}>
              Placement ULID
              <input className={inputClass} name="placementId" placeholder="Optional" />
            </label>
            <label className={labelClass}>
              Database group
              <input className={inputClass} name="databaseGroup" defaultValue="primary" />
            </label>
            <label className={labelClass}>
              Database name
              <input className={inputClass} name="databaseName" placeholder="app_primary" />
            </label>
            <label className={labelClass}>
              Schema
              <input className={inputClass} name="schemaName" placeholder="public" />
            </label>
            <label className={labelClass}>
              Datasource key
              <input className={inputClass} name="datasourceKey" defaultValue="shared" />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Auth Config</CardTitle>
            <CardDescription>
              Password, MFA, session, and token policies are previewed before save.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-3 rounded-lg border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="localPasswordEnabled" defaultChecked />
                Local password login
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="mfaRequired" defaultChecked />
                MFA required
              </label>
              <label className={labelClass}>
                Password policy
                <select className={inputClass} name="passwordPolicy" defaultValue="STRICT">
                  <option value="STANDARD">Standard</option>
                  <option value="STRICT">Strict</option>
                  <option value="HIGH_ASSURANCE">High assurance</option>
                </select>
              </label>
              <label className={labelClass}>
                Minimum password length
                <input
                  className={inputClass}
                  type="number"
                  name="passwordMinLength"
                  defaultValue={12}
                />
              </label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["requireUppercase", "Uppercase"],
                  ["requireLowercase", "Lowercase"],
                  ["requireNumber", "Number"],
                  ["requireSymbol", "Symbol"],
                ].map(([name, label]) => (
                  <label key={name} className="flex items-center gap-2">
                    <input type="checkbox" name={name} defaultChecked />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-3 rounded-lg border p-3">
              <label className={labelClass}>
                MFA mode
                <select className={inputClass} name="mfaMode" defaultValue="REQUIRED_FOR_ALL">
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
                  defaultValue="TOTP,WEBAUTHN"
                />
              </label>
              <label className={labelClass}>
                MFA max age seconds
                <input
                  className={inputClass}
                  type="number"
                  name="mfaMaxAgeSeconds"
                  defaultValue={300}
                />
              </label>
              <label className={labelClass}>
                Enrollment grace days
                <input
                  className={inputClass}
                  type="number"
                  name="enrollmentGracePeriodDays"
                  defaultValue={0}
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="stepUpForSensitiveActions" defaultChecked />
                Step-up sensitive actions
              </label>
            </div>

            <div className="grid gap-3 rounded-lg border p-3">
              <label className={labelClass}>
                Access token TTL
                <input
                  className={inputClass}
                  type="number"
                  name="accessTokenTtlSeconds"
                  defaultValue={900}
                />
              </label>
              <label className={labelClass}>
                Refresh token TTL
                <input
                  className={inputClass}
                  type="number"
                  name="refreshTokenTtlSeconds"
                  defaultValue={28800}
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="refreshTokenRotationEnabled"
                  defaultChecked
                />
                Rotate refresh tokens
              </label>
              <label className={labelClass}>
                Idle timeout seconds
                <input
                  className={inputClass}
                  type="number"
                  name="idleSessionTimeoutSeconds"
                  defaultValue={3600}
                />
              </label>
              <label className={labelClass}>
                Max session lifetime seconds
                <input
                  className={inputClass}
                  type="number"
                  name="maxSessionLifetimeSeconds"
                  defaultValue={43200}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Federation And Provisioning</CardTitle>
            <CardDescription>
              Optional OIDC or SAML provider setup, allowed domains, and SCIM lifecycle.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className={labelClass}>
              Provider key
              <input className={inputClass} name="providerKey" placeholder="microsoft" />
              <span className={hintClass}>Leave blank to skip federation.</span>
            </label>
            <label className={labelClass}>
              Provider display
              <input className={inputClass} name="providerDisplayName" />
            </label>
            <label className={labelClass}>
              Protocol
              <select className={inputClass} name="providerProtocol" defaultValue="OIDC">
                <option value="OIDC">OIDC</option>
                <option value="SAML2">SAML2</option>
              </select>
            </label>
            <label className={labelClass}>
              Type
              <select className={inputClass} name="providerType" defaultValue="MICROSOFT">
                <option value="GOOGLE">Google</option>
                <option value="MICROSOFT">Microsoft</option>
                <option value="OKTA">Okta</option>
                <option value="OIDC">OIDC</option>
                <option value="SAML2">SAML2</option>
              </select>
            </label>
            <label className={labelClass}>
              Issuer URI
              <input className={inputClass} name="issuerUri" />
            </label>
            <label className={labelClass}>
              Client ID
              <input className={inputClass} name="clientId" />
            </label>
            <label className={labelClass}>
              Client secret ref
              <input className={inputClass} name="clientSecretRef" />
            </label>
            <label className={labelClass}>
              IdP metadata URL
              <input className={inputClass} name="idpMetadataUrl" />
            </label>
            <label className={labelClass}>
              IdP entity ID
              <input className={inputClass} name="idpEntityId" />
            </label>
            <label className={labelClass}>
              SSO URL
              <input className={inputClass} name="singleSignOnServiceUrl" />
            </label>
            <label className={labelClass}>
              Allowed domains
              <input className={inputClass} name="allowedDomains" placeholder="acme.com" />
            </label>
            <label className={labelClass}>
              Default role
              <input className={inputClass} name="defaultRole" defaultValue="TENANT_MEMBER" />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="providerEnabled" defaultChecked />
              Provider enabled
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="autoProvision" defaultChecked />
              Auto provision users
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="scimEnabled" />
              SCIM enabled
            </label>
            <label className={labelClass}>
              SCIM base URL
              <input className={inputClass} name="scimBaseUrl" />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner, Context, And Policy Seed</CardTitle>
            <CardDescription>
              Invite the first owner, assign market or organization context, and seed one scoped policy binding.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <section className="grid gap-3 rounded-lg border p-3">
              <label className={labelClass}>
                Owner email
                <input className={inputClass} type="email" name="ownerEmail" />
              </label>
              <label className={labelClass}>
                Owner display name
                <input className={inputClass} name="ownerDisplayName" />
              </label>
              <label className={labelClass}>
                Owner identity subject
                <input className={inputClass} name="ownerIdentityProviderSubject" />
              </label>
              <label className={labelClass}>
                Owner roles
                <input className={inputClass} name="ownerRoles" defaultValue="TENANT_OWNER" />
              </label>
            </section>

            <section className="grid gap-3 rounded-lg border p-3">
              <label className={labelClass}>
                Market code
                <input className={inputClass} name="marketCode" placeholder="KE" />
              </label>
              <label className={labelClass}>
                Market assignment
                <select className={inputClass} name="marketAssignmentType" defaultValue="HOME">
                  <option value="HOME">Home</option>
                  <option value="OPERATING">Operating</option>
                </select>
              </label>
              <label className={labelClass}>
                Organization ID
                <input className={inputClass} name="organizationId" />
              </label>
              <label className={labelClass}>
                Organization relationship
                <select
                  className={inputClass}
                  name="organizationRelationshipType"
                  defaultValue="OWNER"
                >
                  <option value="OWNER">Owner</option>
                  <option value="BILLING">Billing</option>
                  <option value="OPERATING">Operating</option>
                </select>
              </label>
            </section>

            <section className="grid gap-3 rounded-lg border p-3">
              <label className={labelClass}>
                Policy kind
                <input className={inputClass} name="policyKind" placeholder="PRODUCT_AVAILABILITY" />
              </label>
              <label className={labelClass}>
                Policy key
                <input className={inputClass} name="policyKey" placeholder="tenant-launch" />
              </label>
              <label className={labelClass}>
                Policy effect
                <select className={inputClass} name="policyEffect" defaultValue="APPLY">
                  <option value="APPLY">Apply</option>
                  <option value="ENABLE">Enable</option>
                  <option value="DISABLE">Disable</option>
                  <option value="REQUIRE">Require</option>
                  <option value="FORBID">Forbid</option>
                </select>
              </label>
              <label className={labelClass}>
                Policy value JSON
                <textarea
                  className={areaClass}
                  name="policyValue"
                  defaultValue={'{"enabled":true}'}
                />
              </label>
            </section>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 -mx-4 flex justify-end border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
          <Button type="submit" size="lg">
            Register and configure tenant
          </Button>
        </div>
      </form>
    </ControlPanelShell>
  );
}
