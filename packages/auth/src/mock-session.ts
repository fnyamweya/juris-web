import type { AuthenticatedSession, Tenant, User } from "./types";

export const mockUser: User = {
  id: "user_123",
  name: "Amara Okafor",
  email: "amara.okafor@example.com",
  avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Amara%20Okafor",
};

export const mockTenants: Tenant[] = [
  { id: "tenant_alpha", name: "Acme Legal Group", slug: "acme-legal" },
  { id: "tenant_nova", name: "Nova Compliance", slug: "nova-compliance" },
  { id: "tenant_kili", name: "Kilimani Chambers", slug: "kilimani-chambers" },
];

export const mockSession: AuthenticatedSession = {
  status: "authenticated",
  user: mockUser,
  currentTenant: mockTenants[0]!,
  availableTenants: mockTenants,
  roles: ["admin", "billing-manager", "support-lead"],
  permissions: [
    "console:read",
    "admin:read",
    "billing:read",
    "billing:write",
    "reporting:read",
    "settings:read",
    "settings:write",
    "support:read",
  ],
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};
