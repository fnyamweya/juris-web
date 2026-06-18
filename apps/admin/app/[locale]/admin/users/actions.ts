"use server";

import { createCivisClient, type PasswordResetIssued } from "@repo/civis";
import { requirePermission } from "@repo/auth";

export async function resetPlatformUserPassword(userId: string): Promise<PasswordResetIssued> {
  await requirePermission("admin:write");

  const client = await createCivisClient();
  return client.users.resetPassword(userId);
}
