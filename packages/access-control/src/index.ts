import type { Session } from "@repo/auth";
import type { AppManifest } from "@repo/contracts";

/**
 * All UI module permission strings known to the platform.
 * Authoritative list — these must match the `ui_permission` values
 * seeded in `ui_platform_features` (V65 migration).
 */
export const permissions = [
  "console:read",
  "admin:read",
  "admin:write",
  "control-panel:read",
  "control-panel:write",
  "billing:read",
  "billing:write",
  "reporting:read",
  "settings:read",
  "settings:write",
  "support:read",
] as const;

export type Permission = (typeof permissions)[number];

// ─── Client-side helpers (safe in Server Components, Client Components, RSC) ──

export function hasPermission(
  session: Session | undefined,
  permission: string,
): boolean {
  return Boolean(session?.permissions.includes(permission));
}

export function hasAnyPermission(
  session: Session | undefined,
  requestedPermissions: readonly string[],
): boolean {
  return requestedPermissions.some((p) => hasPermission(session, p));
}

export function hasAllPermissions(
  session: Session | undefined,
  requestedPermissions: readonly string[],
): boolean {
  return requestedPermissions.every((p) => hasPermission(session, p));
}

export function canAccessApp(
  session: Session | undefined,
  appManifest: AppManifest,
): boolean {
  if (appManifest.permissions.length === 0) return true;
  return hasAnyPermission(session, appManifest.permissions);
}

// ─── Server Action guard (throws, does not redirect) ─────────────────────────
//
// Use `assertPermission` inside Server Actions where you want an explicit error
// rather than a redirect. The error propagates as an unhandled rejection and is
// surfaced by the nearest `error.tsx` boundary.
//
// For Server Components where a redirect is preferred, use `requirePermission`
// from `@repo/auth` instead.

/**
 * Throws if the session does not include `permission`.
 * Suitable for Server Actions ("use server" functions) that should fail loudly
 * rather than silently redirect.
 *
 * @example
 * export async function deleteUser(userId: string) {
 *   "use server";
 *   assertPermission(await getSession(), "admin:write");
 *   ...
 * }
 */
export function assertPermission(
  session: Session | undefined,
  permission: string,
): void {
  if (!hasPermission(session, permission)) {
    throw new Error(`Forbidden: missing permission "${permission}"`);
  }
}

/**
 * Throws if the session does not include at least one of `requestedPermissions`.
 */
export function assertAnyPermission(
  session: Session | undefined,
  requestedPermissions: readonly string[],
): void {
  if (!hasAnyPermission(session, requestedPermissions)) {
    throw new Error(
      `Forbidden: missing at least one of [${requestedPermissions.join(", ")}]`,
    );
  }
}

// ─── Re-export server guards for convenience ──────────────────────────────────
//
// Apps can import everything auth-related from either `@repo/auth` or
// `@repo/access-control`. No duplication — these re-exports point at the same
// functions.

export {
  requireAllPermissions,
  requireAnyPermission,
  requireAuthenticated,
  requirePermission,
} from "@repo/auth";
