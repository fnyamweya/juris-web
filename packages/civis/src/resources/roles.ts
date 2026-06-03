import type { Http } from "../http";
import type { CursorPage, ListParams, Role } from "../types";

function normalizeRole(role: Role): Role {
  const id = role.id ?? role.roleId ?? "";
  const normalizedId = id.trim().replace(/[-:\s]+/g, "_").toUpperCase();
  return {
    ...role,
    id,
    roleId: role.roleId ?? id,
    displayName: role.displayName ?? id.replace(/_/gu, " ").toLowerCase(),
    scope: role.scope ?? (normalizedId.startsWith("PLATFORM_") ? "PLATFORM" : "TENANT"),
  };
}

export function createRolesResource(http: Http) {
  return {
    async list(params?: ListParams): Promise<CursorPage<Role>> {
      const res = await http.list<Role>("/platform/api/v1/roles", {
        limit: params?.limit,
        cursor: params?.cursor,
        search: params?.search,
      });
      return { data: res.data.map(normalizeRole), meta: res.meta };
    },
  };
}
