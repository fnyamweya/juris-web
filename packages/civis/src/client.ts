import { getAccessToken } from "@repo/auth";
import { requireEnv } from "@repo/platform";
import { CivisApiError } from "./error";
import { createHttp } from "./http";
import { createAuthConfigResource } from "./resources/auth-config";
import { createMembersResource } from "./resources/members";
import { createRolesResource } from "./resources/roles";
import { createTenantsResource } from "./resources/tenants";
import { createUsersResource } from "./resources/users";

export type CivisClient = ReturnType<typeof buildClient>;

function buildClient(accessToken: string, civisCoreUrl: string, tenantId?: string) {
  const http = createHttp({
    baseUrl: civisCoreUrl,
    accessToken,
    ...(tenantId !== undefined ? { tenantId } : {}),
  });
  return {
    tenants: createTenantsResource(http),
    users: createUsersResource(http),
    members: createMembersResource(http),
    authConfig: createAuthConfigResource(http),
    roles: createRolesResource(http),
  };
}

/**
 * Creates an authenticated civis-core API client from the current server-side
 * session cookie.  Must be called from a Next.js Server Component, Route
 * Handler, or Server Action.
 *
 * Throws `CivisApiError` with status 401 when no valid session exists.
 */
export async function createCivisClient(tenantId?: string): Promise<CivisClient> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new CivisApiError(401, {
      code: "AUTHENTICATION_REQUIRED",
      message: "No valid session — user must authenticate first",
    });
  }

  const civisCoreUrl = requireEnv("CIVIS_CORE_URL");

  return buildClient(accessToken, civisCoreUrl, tenantId);
}

/**
 * Creates a client from an explicit token — useful for route handlers that
 * already have the token in scope (e.g. the OAuth callback).
 */
export function createCivisClientWithToken(
  accessToken: string,
  tenantId?: string,
): CivisClient {
  const civisCoreUrl = requireEnv("CIVIS_CORE_URL");
  return buildClient(accessToken, civisCoreUrl, tenantId);
}
