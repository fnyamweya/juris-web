import { hasPermission } from "@repo/access-control";
import { getSession } from "@repo/auth";

type ControlPanelPermission = "control-panel:read" | "control-panel:write";

function isPlatformRole(role: string) {
  return role.trim().replace(/[-:\s]+/g, "_").toUpperCase().startsWith("PLATFORM_");
}

export async function getControlPanelAccess(
  permission: ControlPanelPermission = "control-panel:read",
) {
  const session = await getSession();
  const isPlatformUser =
    session.status === "authenticated" &&
    session.roles.some(isPlatformRole);

  return {
    allowed: isPlatformUser && hasPermission(session, permission),
    session,
  };
}

export async function requireControlPanelAccess(
  permission: ControlPanelPermission = "control-panel:read",
) {
  const { allowed } = await getControlPanelAccess(permission);
  if (!allowed) {
    throw new Error("Platform control panel access requires a platform role.");
  }
}
