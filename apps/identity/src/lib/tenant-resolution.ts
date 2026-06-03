import type { CasAccessTokenClaims, StoredTenant } from "@repo/auth";

type TenantDto = {
  id?: string;
  tenantId?: string;
  name?: string;
  displayName?: string;
  slug?: string;
};

type TenantApiBody = TenantDto | { data?: TenantDto };

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

function tenantFromBody(body: TenantApiBody, fallbackId: string): StoredTenant {
  const data = ("data" in body && body.data ? body.data : body) as TenantDto;
  const id = data.tenantId ?? data.id ?? fallbackId;
  const name = data.displayName ?? data.name ?? id;
  return {
    id,
    name,
    slug: data.slug ?? (slugify(name) || id),
  };
}

function isFulfilled<T>(
  result: PromiseSettledResult<T>,
): result is PromiseFulfilledResult<T> {
  return result.status === "fulfilled";
}

export async function resolveTenantsFromToken(
  accessToken: string,
  civisCoreUrl: string,
): Promise<StoredTenant[]> {
  const claims = parseJwt<CasAccessTokenClaims>(accessToken);
  if (!claims?.tenant_memberships?.length) return [];

  const results = await Promise.allSettled(
    claims.tenant_memberships
      .filter((membership) => membership.status !== "INACTIVE")
      .map(async (membership): Promise<StoredTenant> => {
        const fallback: StoredTenant = {
          id: membership.tenant_id,
          name: membership.tenant_id,
          slug: membership.tenant_id,
        };

        const res = await fetch(
          `${civisCoreUrl}/platform/api/v1/tenants/${membership.tenant_id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          },
        ).catch(() => null);

        if (!res?.ok) return fallback;

        const body = (await res.json()) as TenantApiBody;
        return tenantFromBody(body, membership.tenant_id);
      }),
  );

  return results.filter(isFulfilled).map((result) => result.value);
}

export function activeTenantIdFromToken(accessToken: string) {
  return parseJwt<CasAccessTokenClaims>(accessToken)?.tid ?? undefined;
}
