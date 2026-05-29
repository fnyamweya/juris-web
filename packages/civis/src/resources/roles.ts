import type { Http } from "../http";
import type { CursorPage, ListParams, Role } from "../types";

export function createRolesResource(http: Http) {
  return {
    async list(params?: ListParams): Promise<CursorPage<Role>> {
      const res = await http.list<Role>("/platform/api/v1/roles", {
        limit: params?.limit,
        cursor: params?.cursor,
        search: params?.search,
      });
      return { data: res.data, meta: res.meta };
    },
  };
}
