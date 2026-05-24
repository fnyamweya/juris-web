import { hasPermission } from "@repo/access-control";
import type { Session } from "@repo/auth";
import type { ReactNode } from "react";

export type PermissionGateProps = {
  session?: Session;
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
};

export function canAccessPermission(
  session: Session | undefined,
  permission: string,
) {
  return hasPermission(session, permission);
}

export function PermissionGate({
  session,
  permission,
  fallback,
  children,
}: PermissionGateProps) {
  if (!canAccessPermission(session, permission)) {
    return fallback ?? null;
  }

  return children;
}
