import type { Http } from "../http";
import type {
  CreateTenantRequest,
  CursorPage,
  ListTenantsParams,
  Tenant,
  TenantPlacement,
} from "../types";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

function normalizeTenant(tenant: Tenant): Tenant {
  const tenantId = tenant.tenantId ?? tenant.id;
  return {
    ...tenant,
    tenantId,
    id: tenant.id ?? tenantId,
    slug: tenant.slug ?? slugify(tenant.displayName || tenantId),
  };
}

export function createTenantsResource(http: Http) {
  return {
    async list(params?: ListTenantsParams): Promise<CursorPage<Tenant>> {
      const res = await http.list<Tenant>("/platform/api/v1/tenants", {
        limit: params?.limit,
        cursor: params?.cursor,
        search: params?.search,
        status: params?.status,
        region: params?.region,
        plan: params?.plan,
        createdAfter: params?.createdAfter,
        createdBefore: params?.createdBefore,
        sort: params?.sort,
      });
      return { data: res.data.map(normalizeTenant), meta: res.meta };
    },

    async get(tenantId: string): Promise<Tenant> {
      const res = await http.get<Tenant>(`/platform/api/v1/tenants/${tenantId}`);
      return normalizeTenant(res.data);
    },

    async getPlacement(tenantId: string): Promise<TenantPlacement> {
      const res = await http.get<TenantPlacement>(
        `/platform/api/v1/tenants/${tenantId}/placement`,
      );
      return res.data;
    },

    async create(req: CreateTenantRequest): Promise<Tenant> {
      const res = await http.post<Tenant>("/platform/api/v1/tenants", req);
      return normalizeTenant(res!.data);
    },

    async activate(tenantId: string): Promise<void> {
      await http.post(`/platform/api/v1/tenants/${tenantId}/activate`);
    },

    async suspend(tenantId: string): Promise<void> {
      await http.post(`/platform/api/v1/tenants/${tenantId}/suspend`);
    },

    async archive(tenantId: string): Promise<void> {
      await http.post(`/platform/api/v1/tenants/${tenantId}/archive`);
    },
  };
}
