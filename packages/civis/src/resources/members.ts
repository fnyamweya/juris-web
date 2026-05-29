import type { Http } from "../http";
import type {
  AssignRoleResponse,
  CreateMemberRequest,
  CursorPage,
  ListMembersParams,
  TenantMember,
} from "../types";

export function createMembersResource(http: Http) {
  return {
    async list(
      tenantId: string,
      params?: ListMembersParams,
    ): Promise<CursorPage<TenantMember>> {
      const res = await http.list<TenantMember>(
        `/platform/api/v1/tenants/${tenantId}/members`,
        {
          limit: params?.limit,
          cursor: params?.cursor,
          search: params?.search,
          status: params?.status,
          role: params?.role,
        },
      );
      return { data: res.data, meta: res.meta };
    },

    async get(tenantId: string, userId: string): Promise<TenantMember> {
      const res = await http.get<TenantMember>(
        `/platform/api/v1/tenants/${tenantId}/members/${userId}`,
      );
      return res.data;
    },

    async create(tenantId: string, req: CreateMemberRequest): Promise<TenantMember> {
      const res = await http.post<TenantMember>(
        `/platform/api/v1/tenants/${tenantId}/members`,
        req,
      );
      return res!.data;
    },

    async activate(tenantId: string, userId: string): Promise<void> {
      await http.post(
        `/platform/api/v1/tenants/${tenantId}/members/${userId}/activate`,
      );
    },

    async suspend(tenantId: string, userId: string): Promise<void> {
      await http.post(
        `/platform/api/v1/tenants/${tenantId}/members/${userId}/suspend`,
      );
    },

    async remove(tenantId: string, userId: string): Promise<void> {
      await http.post(
        `/platform/api/v1/tenants/${tenantId}/members/${userId}/remove`,
      );
    },

    async assignRole(
      tenantId: string,
      userId: string,
      roleId: string,
    ): Promise<AssignRoleResponse> {
      const res = await http.post<AssignRoleResponse>(
        `/platform/api/v1/tenants/${tenantId}/members/${userId}/roles`,
        { roleId },
      );
      return res!.data;
    },

    async revokeRole(
      tenantId: string,
      userId: string,
      roleId: string,
    ): Promise<void> {
      await http.del(
        `/platform/api/v1/tenants/${tenantId}/members/${userId}/roles/${roleId}`,
      );
    },
  };
}
