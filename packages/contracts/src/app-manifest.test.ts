import { describe, expect, it } from "vitest";
import {
  AppCriticality,
  AppRuntime,
  Locale,
  validateAppManifest,
} from "./app-manifest";

describe("validateAppManifest", () => {
  it("validates a deployable app manifest", () => {
    expect(
      validateAppManifest({
        name: "billing",
        displayName: "Billing",
        basePath: "/billing",
        owner: "revenue-platform",
        version: "0.1.0",
        criticality: AppCriticality.Tier1,
        runtime: AppRuntime.CloudflareWorkers,
        requiredPlatformVersion: "^0.1.0",
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
      }).name,
    ).toBe("billing");
  });
});
