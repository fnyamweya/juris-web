import type { Http } from "../http";
import type {
  FederatedProviderSetup,
  TenantAuthConfig,
  UpdateMfaPolicyRequest,
  UpdateSessionPolicyRequest,
  UpsertFederatedProviderRequest,
} from "../types";

export function createAuthConfigResource(http: Http) {
  return {
    async get(tenantId: string): Promise<TenantAuthConfig> {
      const res = await http.get<TenantAuthConfig>(
        `/platform/api/v1/tenants/${tenantId}/auth-config`,
      );
      return res.data;
    },

    async updateMfaPolicy(
      tenantId: string,
      req: UpdateMfaPolicyRequest,
    ): Promise<TenantAuthConfig> {
      const res = await http.patch<TenantAuthConfig>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/mfa-policy`,
        req,
      );
      return res.data;
    },

    async updateSessionPolicy(
      tenantId: string,
      req: UpdateSessionPolicyRequest,
    ): Promise<TenantAuthConfig> {
      const res = await http.patch<TenantAuthConfig>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/session-policy`,
        req,
      );
      return res.data;
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
      return res.data;
    },

    async deleteProvider(tenantId: string, providerKey: string): Promise<void> {
      await http.del(
        `/platform/api/v1/tenants/${tenantId}/auth-config/federated-providers/${providerKey}`,
      );
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

    async rollback(tenantId: string, version: number): Promise<TenantAuthConfig> {
      const res = await http.post<TenantAuthConfig>(
        `/platform/api/v1/tenants/${tenantId}/auth-config/rollback/${version}`,
      );
      return res!.data;
    },
  };
}
