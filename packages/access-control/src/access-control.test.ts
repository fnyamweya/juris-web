import { mockSession } from "@repo/auth";
import { describe, expect, it } from "vitest";
import { hasAllPermissions, hasAnyPermission, hasPermission } from "./index";

describe("access control", () => {
  it("checks single and grouped permissions", () => {
    expect(hasPermission(mockSession, "billing:read")).toBe(true);
    expect(hasPermission(mockSession, "admin:write")).toBe(false);
    expect(hasAnyPermission(mockSession, ["admin:write", "support:read"])).toBe(
      true,
    );
    expect(
      hasAllPermissions(mockSession, ["console:read", "settings:read"]),
    ).toBe(true);
  });
});
