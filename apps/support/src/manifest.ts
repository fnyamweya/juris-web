import {
  AppCriticality,
  AppRuntime,
  Locale,
  validateAppManifest,
} from "@repo/contracts";
import packageMetadata from "../package.json";

export const appManifest = validateAppManifest({
  name: "support",
  displayName: "Support",
  basePath: "/support",
  owner: "service-platform",
  version: packageMetadata.version,
  criticality: AppCriticality.Tier2,
  runtime: AppRuntime.CloudflareWorkers,
  requiredPlatformVersion: `^${packageMetadata.version}`,
  permissions: ["support:read"],
  locales: [Locale.En, Locale.Sw, Locale.Fr],
  health: {
    live: "/api/health/live",
    ready: "/api/health/ready",
    version: "/api/health/version",
  },
  observability: {
    serviceName: "web-support",
  },
});
