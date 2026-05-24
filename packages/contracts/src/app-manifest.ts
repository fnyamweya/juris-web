import { z } from "zod";

export enum Locale {
  En = "en",
  Sw = "sw",
  Fr = "fr",
}

export enum AppCriticality {
  Tier0 = "tier-0",
  Tier1 = "tier-1",
  Tier2 = "tier-2",
  Tier3 = "tier-3",
}

export enum AppRuntime {
  CloudflareWorkers = "cloudflare-workers",
  Edge = "edge",
  Node = "node",
}

export const LocaleSchema = z.nativeEnum(Locale);
export const AppCriticalitySchema = z.nativeEnum(AppCriticality);
export const AppRuntimeSchema = z.nativeEnum(AppRuntime);

export const AppManifestSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/),
  displayName: z.string().min(1),
  basePath: z
    .string()
    .min(1)
    .regex(/^\/[a-z0-9-]*$/),
  owner: z.string().min(1),
  version: z.string().min(1),
  criticality: AppCriticalitySchema,
  runtime: AppRuntimeSchema,
  requiredPlatformVersion: z.string().min(1),
  permissions: z.array(z.string().min(1)),
  locales: z.array(LocaleSchema).min(1),
  health: z.object({
    live: z.string().min(1),
    ready: z.string().min(1),
    version: z.string().min(1),
  }),
  observability: z.object({
    serviceName: z.string().min(1),
  }),
});

export type AppManifest = z.infer<typeof AppManifestSchema>;

export function validateAppManifest(manifest: unknown): AppManifest {
  return AppManifestSchema.parse(manifest);
}
