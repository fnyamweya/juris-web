import { getEnv } from "@repo/platform";
import { ensureBffSession } from "./bff-session";
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

// ─── Session construction from decrypted payload ──────────────────────────

function buildSession(payload: SessionPayload): Session {
  const atClaims = parseJwtPayload<CasAccessTokenClaims>(payload.at);
  const itClaims = parseJwtPayload<CasIdTokenClaims>(payload.it);

  if (!atClaims || !itClaims) return ANONYMOUS_SESSION;

  // CAS may omit fields that are empty arrays — guard every array access.
  const platformRoles: string[] = atClaims.platform_roles ?? [];
  const tenantMemberships: CasTenantMembership[] =
    atClaims.tenant_memberships ?? [];

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

  const currentTenant =
    availableTenants.find((t) => t.id === payload.activeTenantId) ??
    availableTenants[0];

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
    permissions: payload.uiPermissions ?? [],
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
  if (getEnv("USE_MOCK_SESSION") === "true" && !getEnv("SESSION_SECRET")) {
    return mockSession;
  }

  const secret = getEnv("SESSION_SECRET");

  let cookieValue: string | undefined;
  try {
    // Dynamic import keeps @repo/auth free of a hard next dependency.
    // vite-ignore: intentional runtime-only resolution; unavailable outside Next.js
    const nextHeaders = await import(/* @vite-ignore */ "next/headers").catch(
      () => null,
    );
    if (nextHeaders) {
      const store = await nextHeaders.cookies();
      cookieValue = store.get(SESSION_COOKIE_NAME)?.value;
    }
  } catch {
    return ANONYMOUS_SESSION;
  }

  if (!cookieValue) return ANONYMOUS_SESSION;

  const legacyPayload = secret
    ? await decodeSessionCookie(cookieValue, secret)
    : null;
  if (legacyPayload) {
    // Treat expired access tokens as anonymous; middleware handles refresh/redirect
    if (legacyPayload.exp * 1000 < Date.now()) return ANONYMOUS_SESSION;
    return buildSession(legacyPayload);
  }

  const bffSession = await ensureBffSession(cookieValue, {
    touch: true,
    refreshThresholdSeconds: 60,
  });
  if (bffSession.status !== "ACTIVE" || !bffSession.payload) {
    return ANONYMOUS_SESSION;
  }
  return buildSession(bffSession.payload);
}
