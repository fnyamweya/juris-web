import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "./types";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn<() => Promise<Session>>(),
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("./session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

const ANONYMOUS_SESSION: Session = {
  status: "anonymous",
  availableTenants: [],
  roles: [],
  permissions: [],
};

const AUTHENTICATED_SESSION: Session = {
  status: "authenticated",
  user: {
    id: "user-1",
    name: "Tenant User",
    email: "tenant@example.com",
  },
  currentTenant: {
    id: "tenant-1",
    name: "Acme",
    slug: "acme",
  },
  availableTenants: [
    {
      id: "tenant-1",
      name: "Acme",
      slug: "acme",
    },
  ],
  roles: ["TENANT_MEMBER"],
  permissions: [],
};

describe("permission guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects anonymous users to redirectTo", async () => {
    const { requirePermission } = await import("./guards");
    mocks.getSession.mockResolvedValue(ANONYMOUS_SESSION);

    await expect(
      requirePermission("console:read", {
        redirectTo: "/en/login",
        unauthorizedTo: "/en/401",
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/en/login");

    expect(mocks.redirect).toHaveBeenCalledWith("/en/login");
  });

  it("redirects authenticated users without permission to unauthorizedTo", async () => {
    const { requirePermission } = await import("./guards");
    mocks.getSession.mockResolvedValue(AUTHENTICATED_SESSION);

    await expect(
      requirePermission("console:read", {
        redirectTo: "/en/login",
        unauthorizedTo: "/en/401",
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/en/401");

    expect(mocks.redirect).toHaveBeenCalledWith("/en/401");
  });

  it("redirects authenticated-but-unauthorized callers to /forbidden, independent of redirectTo", async () => {
    const { requirePermission } = await import("./guards");
    mocks.getSession.mockResolvedValue(AUTHENTICATED_SESSION);

    await expect(
      requirePermission("admin:read", { redirectTo: "/en/console" }),
    ).rejects.toThrow("NEXT_REDIRECT:/forbidden");

    expect(mocks.redirect).toHaveBeenCalledWith("/forbidden");
  });

  it("returns the authenticated session when the permission is present", async () => {
    const { requirePermission } = await import("./guards");
    const session = {
      ...AUTHENTICATED_SESSION,
      permissions: ["console:read"],
    };
    mocks.getSession.mockResolvedValue(session);

    await expect(requirePermission("console:read")).resolves.toBe(session);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("uses unauthorizedTo for authenticated users missing any requested permission", async () => {
    const { requireAnyPermission } = await import("./guards");
    mocks.getSession.mockResolvedValue(AUTHENTICATED_SESSION);

    await expect(
      requireAnyPermission(["admin:read", "billing:read"], {
        redirectTo: "/en/login",
        unauthorizedTo: "/en/401",
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/en/401");
  });

  it("uses unauthorizedTo for authenticated users missing all requested permissions", async () => {
    const { requireAllPermissions } = await import("./guards");
    mocks.getSession.mockResolvedValue({
      ...AUTHENTICATED_SESSION,
      permissions: ["console:read"],
    });

    await expect(
      requireAllPermissions(["console:read", "admin:read"], {
        redirectTo: "/en/login",
        unauthorizedTo: "/en/401",
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/en/401");
  });
});
