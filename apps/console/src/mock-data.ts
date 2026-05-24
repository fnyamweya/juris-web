export const metrics = [
  {
    title: "Active Tenants",
    value: "128",
    change: "+8.2%",
    trend: "up" as const,
  },
  {
    title: "API Requests",
    value: "8.4M",
    change: "+14.1%",
    trend: "up" as const,
  },
  {
    title: "Open Tickets",
    value: "23",
    change: "-6 today",
    trend: "down" as const,
  },
  {
    title: "Error Rate",
    value: "0.08%",
    change: "stable",
    trend: "flat" as const,
  },
];

export const activityRows = [
  {
    Event: "Matter export completed",
    Tenant: "Acme Legal Group",
    Status: "active",
  },
  {
    Event: "Policy review queued",
    Tenant: "Nova Compliance",
    Status: "pending",
  },
  { Event: "New user invited", Tenant: "Kilimani Chambers", Status: "active" },
];
