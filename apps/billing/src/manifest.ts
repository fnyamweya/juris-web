import {
  AppCriticality,
  AppRuntime,
  Locale,
  validateAppManifest,
} from "@repo/contracts";
import packageMetadata from "../package.json";

export const appManifest = validateAppManifest({
  name: "billing",
  displayName: "Billing",
  basePath: "/billing",
  owner: "revenue-platform",
  version: packageMetadata.version,
  criticality: AppCriticality.Tier1,
  runtime: AppRuntime.CloudflareWorkers,
  requiredPlatformVersion: `^${packageMetadata.version}`,
  permissions: ["billing:read"],
  locales: [Locale.En, Locale.Sw, Locale.Fr],
  health: {
    live: "/api/health/live",
    ready: "/api/health/ready",
    version: "/api/health/version",
  },
  observability: {
    serviceName: "web-billing",
  },
});
