import { CivisApiError, createCivisClient } from "@repo/civis";
import type {
  Role,
  FederatedProviderSetup,
  Tenant,
  TenantAuthConfig,
  TenantAuthConfigEffective,
  TenantAuthConfigRevision,
  TenantMarketContext,
  TenantMember,
  TenantOrganizationContext,
  TenantPlacement,
} from "@repo/civis";

export type TenantBundle = {
  tenant: Tenant;
  placement?: TenantPlacement;
  authConfig?: TenantAuthConfig;
  effectiveAuthConfig?: TenantAuthConfigEffective;
  authRevisions: TenantAuthConfigRevision[];
  members: TenantMember[];
  marketContext?: TenantMarketContext;
  organizationContext?: TenantOrganizationContext;
  roles: Role[];
  providerSetups: FederatedProviderSetup[];
  policyCache?: Record<string, unknown>;
};

export async function fetchTenants(limit = 100): Promise<Tenant[]> {
  try {
    const client = await createCivisClient();
    const page = await client.tenants.list({ limit, sort: "-createdAt" });
    return page.data;
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return [];
  }
}

export async function fetchTenantBundle(tenantId: string): Promise<TenantBundle | null> {
  try {
    const client = await createCivisClient();
    const [
      tenant,
      placement,
      authConfig,
      effectiveAuthConfig,
      authRevisions,
      membersPage,
      marketContext,
      organizationContext,
      rolesPage,
      policyCache,
    ] = await Promise.all([
      client.tenants.get(tenantId),
      client.tenants.getPlacement(tenantId).catch(() => undefined),
      client.authConfig.get(tenantId).catch(() => undefined),
      client.authConfig.getEffective(tenantId).catch(() => undefined),
      client.authConfig.listVersions(tenantId, 8).catch(() => []),
      client.members.list(tenantId, { limit: 50 }).catch(() => ({
        data: [],
        meta: { limit: 50, nextCursor: null, hasMore: false },
      })),
      client.tenantContext.getMarketContext(tenantId).catch(() => undefined),
      client.tenantContext.getOrganizationContext(tenantId).catch(() => undefined),
      client.roles.list({ limit: 100 }).catch(() => ({
        data: [],
        meta: { limit: 100, nextCursor: null, hasMore: false },
      })),
      client.policies.cacheStats().catch(() => undefined),
    ]);

    const providerSetups = await Promise.all(
      (authConfig?.externalIdentityProviders ?? []).map((provider) =>
        client.authConfig
          .getProviderSetup(tenantId, provider.providerKey)
          .catch(() => undefined),
      ),
    );

    return {
      tenant,
      ...(placement ? { placement } : {}),
      ...(authConfig ? { authConfig } : {}),
      ...(effectiveAuthConfig ? { effectiveAuthConfig } : {}),
      authRevisions,
      members: membersPage.data,
      ...(marketContext ? { marketContext } : {}),
      ...(organizationContext ? { organizationContext } : {}),
      roles: rolesPage.data,
      providerSetups: providerSetups.filter(
        (setup): setup is FederatedProviderSetup => Boolean(setup),
      ),
      ...(policyCache ? { policyCache } : {}),
    };
  } catch (err) {
    if (err instanceof CivisApiError && err.isUnauthorized) throw err;
    return null;
  }
}

export function tenantIdOf(tenant: Tenant) {
  return tenant.tenantId ?? tenant.id;
}

export function formatSeconds(seconds?: number) {
  if (!seconds) return "n/a";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86_400)}d`;
}

export function statusTone(
  status: string,
): "active" | "pending" | "inactive" | "danger" {
  if (status === "ACTIVE" || status === "READY") return "active";
  if (status === "PROVISIONING" || status === "PENDING" || status === "MIGRATING") {
    return "pending";
  }
  if (status === "FAILED") return "danger";
  return "inactive";
}
