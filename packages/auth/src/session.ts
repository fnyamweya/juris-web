import { getEnv } from "@repo/platform";
import { mockSession } from "./mock-session";
import { decodeSessionCookie, SESSION_COOKIE_NAME } from "./session-codec";
import type {
  AuthenticatedSession,
  CasAccessTokenClaims,
  CasIdTokenClaims,
  CasTenantMembership,
  Session,
  SessionPayload,
  StoredTenant,
  Tenant,
  User,
} from "./types";

export { mockSession };

const ANONYMOUS_SESSION: Session = {
  status: "anonymous",
  availableTenants: [],
  roles: [],
  permissions: [],
};

// ─── JWT payload extraction (no signature verification — CAS does that) ───

function parseJwtPayload<T>(token: string): T | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;
    const padded =
      payloadB64.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (payloadB64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as T;
  } catch {
    return null;
  }
}

// ─── Role → permission mapping ────────────────────────────────────────────

const ALL_PERMISSIONS = [
  "console:read",
  "admin:read",
  "admin:write",
  "billing:read",
  "billing:write",
  "reporting:read",
  "settings:read",
  "settings:write",
  "support:read",
] as const;

const PLATFORM_ROLE_PERMISSIONS: Record<string, string[]> = {
  PLATFORM_SUPER_ADMIN: [...ALL_PERMISSIONS],
  PLATFORM_ADMIN: [
    "console:read",
    "admin:read",
    "admin:write",
    "reporting:read",
  ],
  PLATFORM_SUPPORT: ["support:read"],
  PLATFORM_SECURITY: [],
};

const TENANT_ROLE_PERMISSIONS: Record<string, string[]> = {
  TENANT_OWNER: [
    "console:read",
    "billing:read",
    "billing:write",
    "settings:read",
    "settings:write",
    "support:read",
    "reporting:read",
  ],
  TENANT_ADMIN: [
    "console:read",
    "settings:read",
    "settings:write",
    "support:read",
    "reporting:read",
  ],
  TENANT_BILLING: ["console:read", "billing:read", "billing:write"],
  TENANT_SUPPORT: ["console:read", "support:read"],
  TENANT_MEMBER: ["console:read"],
};

function derivePermissions(
  platformRoles: string[],
  tenantRoles: string[],
): string[] {
  const set = new Set<string>();

  for (const role of platformRoles) {
    for (const perm of PLATFORM_ROLE_PERMISSIONS[role] ?? []) {
      set.add(perm);
    }
  }

  for (const role of tenantRoles) {
    for (const perm of TENANT_ROLE_PERMISSIONS[role] ?? []) {
      set.add(perm);
    }
  }

  if (set.size === 0) {
    set.add("console:read");
  }

  return [...set];
}

// ─── Session construction from decrypted payload ──────────────────────────

function buildSession(payload: SessionPayload): Session {
  const atClaims = parseJwtPayload<CasAccessTokenClaims>(payload.at);
  const itClaims = parseJwtPayload<CasIdTokenClaims>(payload.it);

  if (!atClaims || !itClaims) return ANONYMOUS_SESSION;

  // CAS may omit fields that are empty arrays — guard every array access.
  const platformRoles: string[] = atClaims.platform_roles ?? [];
  const tenantMemberships: CasTenantMembership[] = atClaims.tenant_memberships ?? [];

  const userId = atClaims.user_id ?? atClaims.sub;

  const user: User = {
    id: userId,
    name: itClaims.name ?? userId,
    email: itClaims.email ?? "",
    ...(itClaims.picture !== undefined ? { avatarUrl: itClaims.picture } : {}),
  };

  const availableTenants: Tenant[] = payload.tenants.map((t: StoredTenant) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
  }));

  const currentTenant = availableTenants[0];

  const activeMembership = tenantMemberships.find(
    (m) => m.tenant_id === currentTenant?.id && m.status !== "INACTIVE",
  );

  const tenantRoles = activeMembership?.roles ?? [];
  const allRoles = [...platformRoles, ...tenantRoles];

  return {
    status: "authenticated",
    user,
    ...(currentTenant !== undefined ? { currentTenant } : {}),
    availableTenants,
    roles: allRoles,
    permissions: derivePermissions(platformRoles, tenantRoles),
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function getMockSession(): Promise<AuthenticatedSession> {
  return Promise.resolve(mockSession);
}

export async function getSession(): Promise<Session> {
  // Explicit mock bypass — only when USE_MOCK_SESSION=true and no real secret
  // is configured (prevents accidental activation in staging/production).
  if (
    getEnv("USE_MOCK_SESSION") === "true" &&
    !getEnv("SESSION_SECRET")
  ) {
    return mockSession;
  }

  const secret = getEnv("SESSION_SECRET");
  if (!secret) return ANONYMOUS_SESSION;

  let cookieValue: string | undefined;
  try {
    // Dynamic import keeps @repo/auth free of a hard next dependency.
    // vite-ignore: intentional runtime-only resolution; unavailable outside Next.js
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    const nextHeaders = await import(/* @vite-ignore */ "next/headers").catch(() => null);
    if (nextHeaders) {
      const store = await nextHeaders.cookies();
      cookieValue = store.get(SESSION_COOKIE_NAME)?.value;
    }
  } catch {
    return ANONYMOUS_SESSION;
  }

  if (!cookieValue) return ANONYMOUS_SESSION;

  const payload = await decodeSessionCookie(cookieValue, secret);
  if (!payload) return ANONYMOUS_SESSION;

  // Treat expired access tokens as anonymous; middleware handles refresh/redirect
  if (payload.exp * 1000 < Date.now()) return ANONYMOUS_SESSION;

  return buildSession(payload);
}
