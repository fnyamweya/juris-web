import type { CasAccessTokenClaims, StoredTenant } from "@repo/auth";

type MeTenantView = {
  tenantId?: string;
  tenantName?: string;
  status?: string;
  roles?: string[];
};

function parseJwt<T>(token: string): T | null {
  try {
    const b64 = token.split(".")[1];
    if (!b64) return null;
    const padded =
      b64.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as T;
  } catch {
    return null;
  }
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

/**
 * Resolves the signed-in user's tenant memberships from the authoritative `GET /me/tenants`
 * endpoint (AUTH-022). Realm-scoped access tokens no longer embed the full `tenant_memberships`
 * list, so the membership list is fetched with the freshly issued access token rather than decoded
 * from the token.
 */
export async function resolveTenantsFromToken(
  accessToken: string,
  civisCoreUrl: string,
): Promise<StoredTenant[]> {
  const res = await fetch(`${civisCoreUrl}/platform/api/v1/me/tenants`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  }).catch(() => null);

  if (!res?.ok) return [];

  const body = (await res.json().catch(() => null)) as {
    data?: MeTenantView[];
  } | null;
  const memberships = body?.data ?? [];

  return memberships
    .filter((membership): membership is MeTenantView & { tenantId: string } =>
      Boolean(membership.tenantId),
    )
    .filter((membership) => membership.status !== "INACTIVE")
    .map((membership) => {
      const name = membership.tenantName ?? membership.tenantId;
      return {
        id: membership.tenantId,
        name,
        slug: slugify(name) || membership.tenantId,
      };
    });
}

export function activeTenantIdFromToken(accessToken: string) {
  return parseJwt<CasAccessTokenClaims>(accessToken)?.tid ?? undefined;
}
