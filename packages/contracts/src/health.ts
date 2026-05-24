import { z } from "zod";

export const HealthStatusSchema = z.enum([
  "healthy",
  "degraded",
  "unavailable",
]);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const HealthResponseSchema = z.object({
  status: HealthStatusSchema,
  service: z.string().min(1),
  version: z.string().min(1),
  timestamp: z.string().datetime(),
  checks: z.record(z.string(), z.unknown()).optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const VersionResponseSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  gitSha: z.string().min(1),
  buildTime: z.string().min(1),
  runtime: z.string().min(1),
});

export type VersionResponse = z.infer<typeof VersionResponseSchema>;
