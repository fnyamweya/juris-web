import { CivisApiError, createCivisClient } from "@repo/civis";
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
} from "@repo/ui";
import { ControlPanelShell } from "@/components/control-panel-shell";
import { getControlPanelAccess } from "@/lib/access";
import {
  createPolicyDefinition,
  invalidatePolicyCache,
  policyDefinitionLifecycleAction,
  upsertPolicyBinding,
} from "../server-actions";

const inputClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
const areaClass =
  "min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

async function fetchPolicyCache() {
  try {
    const client = await createCivisClient();
    return await client.policies.cacheStats();
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return {};
  }
}

export default async function PoliciesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const access = await getControlPanelAccess();
  if (!access.allowed) {
    return (
      <ControlPanelShell
        locale={locale}
        breadcrumbLabel="Policies"
        title="Tenant Policy Operations"
        description="Create tenant-scoped policy bindings, inspect cache posture, and map policy operations to tenant onboarding."
      >
        {null}
      </ControlPanelShell>
    );
  }

  const cache = await fetchPolicyCache();

  return (
    <ControlPanelShell
      locale={locale}
      breadcrumbLabel="Policies"
      title="Tenant Policy Operations"
      description="Create tenant-scoped policy bindings, inspect cache posture, and map policy operations to tenant onboarding."
    >
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upsert Binding</CardTitle>
            <CardDescription>
              Uses the policy binding endpoint and supports tenant, market, org,
              global, and subject scopes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={upsertPolicyBinding} className="grid gap-3">
              <input type="hidden" name="locale" value={locale} />
              <input
                className={inputClass}
                name="tenantId"
                placeholder="Tenant id for revalidation"
              />
              <input
                className={inputClass}
                name="policyKind"
                placeholder="PRODUCT_AVAILABILITY"
                required
              />
              <input
                className={inputClass}
                name="policyKey"
                placeholder="tenant-launch"
                required
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={inputClass}
                  name="scopeKind"
                  defaultValue="TENANT"
                />
                <input
                  className={inputClass}
                  name="scopeRef"
                  placeholder="tenant id"
                />
                <input
                  className={inputClass}
                  type="number"
                  name="schemaVersion"
                  defaultValue={1}
                />
                <input
                  className={inputClass}
                  type="number"
                  name="precedence"
                  defaultValue={1000}
                />
                <select
                  className={inputClass}
                  name="lane"
                  defaultValue="NORMAL"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="FALLBACK">Fallback</option>
                </select>
                <select
                  className={inputClass}
                  name="status"
                  defaultValue="ACTIVE"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>
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
              <input
                className={inputClass}
                name="reason"
                placeholder="Reason"
              />
              <Button type="submit">Upsert policy binding</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policy Surface</CardTitle>
            <CardDescription>
              Available policy actions wired in the Civis client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={["Action", "Endpoint", "Mode"]}
              rows={[
                ["List bindings", "GET /policies/{policyKey}/bindings", "Read"],
                [
                  "Upsert binding",
                  "PUT /policies/{policyKey}/bindings",
                  "Write",
                ],
                [
                  "Patch binding",
                  "PATCH /policies/{policyKey}/bindings/{bindingId}",
                  "Write",
                ],
                [
                  "Activate / suspend / retire",
                  "POST /bindings/{bindingId}/{transition}",
                  "Sensitive",
                ],
                ["Clone binding", "POST /bindings/{bindingId}/clone", "Write"],
                ["Resolve preview", "POST /policies/resolve-preview", "Read"],
                ["Explain resolution", "POST /policies/explain", "Read"],
                ["Create definition", "POST /policies/definitions", "Write"],
                [
                  "List definition versions",
                  "GET /policies/definitions/{kind}/versions",
                  "Read",
                ],
                [
                  "Validate definition value",
                  "POST /definitions/{kind}/versions/{version}/validate-value",
                  "Read",
                ],
                [
                  "Activate / deprecate definition",
                  "POST /definitions/{kind}/versions/{version}/{action}",
                  "Sensitive",
                ],
                ["Cache stats", "GET /policies/_cache/stats", "Operator"],
                ["Invalidate cache", "DELETE /policies/_cache", "Operator"],
              ].map(([Action, Endpoint, Mode]) => ({
                Action,
                Endpoint,
                Mode: (
                  <Badge
                    variant={Mode === "Sensitive" ? "warning" : "secondary"}
                  >
                    {Mode}
                  </Badge>
                ),
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Definition Version</CardTitle>
            <CardDescription>
              Register a versioned policy schema before tenant-scoped bindings
              are activated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createPolicyDefinition} className="grid gap-3">
              <input type="hidden" name="locale" value={locale} />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={inputClass}
                  name="policyKind"
                  placeholder="PRODUCT_AVAILABILITY"
                  required
                />
                <input
                  className={inputClass}
                  type="number"
                  name="schemaVersion"
                  defaultValue={1}
                />
                <input
                  className={inputClass}
                  name="description"
                  placeholder="Description"
                />
                <input
                  className={inputClass}
                  name="compatibilityMode"
                  placeholder="STRICT"
                />
                <input
                  className={inputClass}
                  name="supportedScopeKinds"
                  placeholder="TENANT,MARKET,GLOBAL"
                />
                <input
                  className={inputClass}
                  name="supportedPolicyKeys"
                  placeholder="tenant-launch,settlement"
                />
              </div>
              <input
                className={inputClass}
                name="defaultResolutionProfileId"
                placeholder="Default resolution profile id"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input name="requiresFallback" type="checkbox" />
                Requires fallback binding
              </label>
              <textarea
                className={areaClass}
                name="valueSchema"
                defaultValue={'{"type":"object","additionalProperties":true}'}
                required
              />
              <Button type="submit">Create definition</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Definition Lifecycle</CardTitle>
            <CardDescription>
              Activate safe versions or deprecate old versions after binding
              checks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={policyDefinitionLifecycleAction}
              className="grid gap-3"
            >
              <input type="hidden" name="locale" value={locale} />
              <input
                className={inputClass}
                name="policyKind"
                placeholder="PRODUCT_AVAILABILITY"
                required
              />
              <input
                className={inputClass}
                type="number"
                name="schemaVersion"
                defaultValue={1}
              />
              <select
                className={inputClass}
                name="action"
                defaultValue="activate"
              >
                <option value="activate">Activate version</option>
                <option value="deprecate">Deprecate version</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input name="force" type="checkbox" />
                Force deprecation
              </label>
              <Button type="submit">Run lifecycle action</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cache Stats</CardTitle>
          <CardDescription>
            Current binding, effective, and resolution profile cache counters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs">
            {JSON.stringify(cache, null, 2)}
          </pre>
          <form action={invalidatePolicyCache} className="mt-3">
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="secondary">
              Invalidate policy cache
            </Button>
          </form>
        </CardContent>
      </Card>
    </ControlPanelShell>
  );
}
