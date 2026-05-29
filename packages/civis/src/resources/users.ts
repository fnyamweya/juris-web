import type { Http } from "../http";
import type {
  CreateUserRequest,
  CursorPage,
  ListUsersParams,
  PlatformUser,
} from "../types";

export function createUsersResource(http: Http) {
  return {
    async list(params?: ListUsersParams): Promise<CursorPage<PlatformUser>> {
      const res = await http.list<PlatformUser>("/platform/api/v1/users", {
        limit: params?.limit,
        cursor: params?.cursor,
        search: params?.search,
        status: params?.status,
        role: params?.role,
        tenantId: params?.tenantId,
      });
      return { data: res.data, meta: res.meta };
    },

    async get(userId: string): Promise<PlatformUser> {
      const res = await http.get<PlatformUser>(`/platform/api/v1/users/${userId}`);
      return res.data;
    },

    async create(req: CreateUserRequest): Promise<PlatformUser> {
      const res = await http.post<PlatformUser>("/platform/api/v1/users", req);
      return res!.data;
    },

    async activate(userId: string): Promise<void> {
      await http.post(`/platform/api/v1/users/${userId}/activate`);
    },

    async suspend(userId: string): Promise<void> {
      await http.post(`/platform/api/v1/users/${userId}/suspend`);
    },

    async deactivate(userId: string): Promise<void> {
      await http.post(`/platform/api/v1/users/${userId}/deactivate`);
    },

    async assignRole(userId: string, roleId: string): Promise<void> {
      await http.post(`/platform/api/v1/users/${userId}/roles`, { roleId });
    },

    async revokeRole(userId: string, roleId: string): Promise<void> {
      await http.del(`/platform/api/v1/users/${userId}/roles/${roleId}`);
    },
  };
}
