export const users = [
  { Name: "Amara Okafor", Role: "Admin", Status: "active" },
  { Name: "Louis Martin", Role: "Auditor", Status: "pending" },
  { Name: "Neema Mwangi", Role: "Support", Status: "active" },
];

export const tenants = [
  { Name: "Acme Legal Group", Plan: "Enterprise", Status: "active" },
  { Name: "Nova Compliance", Plan: "Business", Status: "active" },
  { Name: "Kilimani Chambers", Plan: "Business", Status: "inactive" },
];

export const auditEvents = [
  {
    id: "evt_1",
    actor: "Amara Okafor",
    action: "Updated tenant policy",
    target: "Acme Legal Group",
    severity: "info" as const,
    occurredAt: "2026-05-23T08:00:00.000Z",
  },
  {
    id: "evt_2",
    actor: "System",
    action: "Blocked risky session",
    target: "Nova Compliance",
    severity: "warning" as const,
    occurredAt: "2026-05-23T09:00:00.000Z",
  },
];
