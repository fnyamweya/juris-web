import { z } from "zod";

export const AuditEventSchema = z.object({
  id: z.string().min(1),
  actor: z.string().min(1),
  action: z.string().min(1),
  target: z.string().min(1),
  severity: z.enum(["info", "warning", "danger"]),
  occurredAt: z.string().datetime(),
  tenantId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
