import type { Http } from "../http";
import type {
  FederatedAttributePreview,
  FederatedProviderSetup,
  TenantAuthConfig,
  TenantAuthConfigEffective,
  TenantAuthConfigPreview,
  TenantAuthConfigRevision,
  UpdateAccountLifecyclePolicyRequest,
  UpdateMfaPolicyRequest,
  UpdateSessionPolicyRequest,
  UpdateTenantAuthConfigRequest,
  UpsertFederatedProviderRequest,
} from "../types";

function normalizeAuthConfig(config: TenantAuthConfig): TenantAuthConfig {
  return {
    ...config,
    federatedProviders:
      config.federatedProviders ?? config.externalIdentityProviders ?? [],
    externalIdentityProviders:
      config.externalIdentityProviders ?? config.federatedProviders ?? [],
  };
}

export function createAuthConfigResource(http: Http) {
  return {
    async get(tenantId: string): Promise<TenantAuthConfig> {
      const res = await http.get<TenantAuthConfig>(
        `/platform/api/v1/tenants/${tenantId}/auth-config`,
      );
      return normalizeAuthConfig(res.data);
    },

    async getEffective(tenantId: string): Promise<TenantAuthConfigEffective> {
      const res = await http.get<TenantAuthConfigEffective>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/effective`,
      );
      return {
        ...res.data,
        config: normalizeAuthConfig(res.data.config),
      };
    },

    async validate(
      tenantId: string,
      req: UpdateTenantAuthConfigRequest,
    ): Promise<TenantAuthConfigPreview> {
      const res = await http.post<TenantAuthConfigPreview>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/validate`,
        req,
      );
      return normalizePreview(res!.data);
    },

    async preview(
      tenantId: string,
      req: UpdateTenantAuthConfigRequest,
    ): Promise<TenantAuthConfigPreview> {
      const res = await http.post<TenantAuthConfigPreview>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/preview`,
        req,
      );
      return normalizePreview(res!.data);
    },

    async update(
      tenantId: string,
      req: UpdateTenantAuthConfigRequest,
    ): Promise<TenantAuthConfig> {
      const res = await http.put<TenantAuthConfig>(
        `/platform/api/v1/tenants/${tenantId}/auth-config`,
        req,
      );
      return normalizeAuthConfig(res.data);
    },

    async listVersions(
      tenantId: string,
      limit = 20,
    ): Promise<TenantAuthConfigRevision[]> {
      const res = await http.get<TenantAuthConfigRevision[]>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/versions`,
        { limit },
      );
      return res.data.map((revision) => ({
        ...revision,
        config: normalizeAuthConfig(revision.config),
      }));
    },

    async updateMfaPolicy(
      tenantId: string,
      req: UpdateMfaPolicyRequest,
    ): Promise<TenantAuthConfig> {
      const res = await http.patch<TenantAuthConfig>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/mfa-policy`,
        req,
      );
      return normalizeAuthConfig(res.data);
    },

    async updateSessionPolicy(
      tenantId: string,
      req: UpdateSessionPolicyRequest,
    ): Promise<TenantAuthConfig> {
      const res = await http.patch<TenantAuthConfig>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/session-policy`,
        req,
      );
      return normalizeAuthConfig(res.data);
    },

    async updateAccountLifecyclePolicy(
      tenantId: string,
      req: UpdateAccountLifecyclePolicyRequest,
    ): Promise<TenantAuthConfig> {
      const res = await http.patch<TenantAuthConfig>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/account-lifecycle-policy`,
        req,
      );
      return normalizeAuthConfig(res.data);
    },

    async upsertProvider(
      tenantId: string,
      providerKey: string,
      req: UpsertFederatedProviderRequest,
    ): Promise<TenantAuthConfig> {
      const res = await http.put<TenantAuthConfig>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/federated-providers/${providerKey}`,
        req,
      );
      return normalizeAuthConfig(res.data);
    },

    async deleteProvider(
      tenantId: string,
      providerKey: string,
    ): Promise<TenantAuthConfig | null> {
      const res = await http.del<TenantAuthConfig>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/federated-providers/${providerKey}`,
      );
      return res ? normalizeAuthConfig(res.data) : null;
    },

    async getProviderSetup(
      tenantId: string,
      providerKey: string,
    ): Promise<FederatedProviderSetup> {
      const res = await http.get<FederatedProviderSetup>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/federated-providers/${providerKey}/setup`,
      );
      return res.data;
    },

    async previewProviderAttributes(
      tenantId: string,
      providerKey: string,
      attributes: Record<string, unknown>,
    ): Promise<FederatedAttributePreview> {
      const res = await http.post<FederatedAttributePreview>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/federated-providers/${providerKey}/preview-attributes`,
        attributes,
      );
      return res!.data;
    },

    async rollback(
      tenantId: string,
      version: number,
      req?: { reason?: string; revokeAffectedSessions?: boolean },
    ): Promise<TenantAuthConfig> {
      const res = await http.post<TenantAuthConfig>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/rollback/${version}`,
        req,
      );
      return normalizeAuthConfig(res!.data);
    },
  };
}

function normalizePreview(preview: TenantAuthConfigPreview): TenantAuthConfigPreview {
  return {
    ...preview,
    effectivePolicy: {
      ...preview.effectivePolicy,
      config: normalizeAuthConfig(preview.effectivePolicy.config),
    },
    proposedConfig: normalizeAuthConfig(preview.proposedConfig),
  };
}
