import type { Http } from "../http";
import type {
  CreateTenantRequest,
  CursorPage,
  ListTenantsParams,
  Tenant,
} from "../types";

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
      });
      return { data: res.data, meta: res.meta };
    },

    async get(tenantId: string): Promise<Tenant> {
      const res = await http.get<Tenant>(`/platform/api/v1/tenants/${tenantId}`);
      return res.data;
    },

    async create(req: CreateTenantRequest): Promise<Tenant> {
      const res = await http.post<Tenant>("/platform/api/v1/tenants", req);
      return res!.data;
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
