import type { Session } from "@repo/auth";
import type { AppManifest } from "@repo/contracts";

export const permissions = [
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

export type Permission = (typeof permissions)[number];

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
  return requestedPermissions.some((permission) =>
    hasPermission(session, permission),
  );
}

export function hasAllPermissions(
  session: Session | undefined,
  requestedPermissions: readonly string[],
): boolean {
  return requestedPermissions.every((permission) =>
    hasPermission(session, permission),
  );
}

export function canAccessApp(
  session: Session | undefined,
  appManifest: AppManifest,
): boolean {
  if (appManifest.permissions.length === 0) {
    return true;
  }

  return hasAnyPermission(session, appManifest.permissions);
}
