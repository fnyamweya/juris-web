import { initializeTelemetry } from "@repo/telemetry";
import packageMetadata from "./package.json";

export function register() {
  initializeTelemetry({
    serviceName: "web-admin",
    version: packageMetadata.version,
    appName: "admin",
    runtime: "cloudflare-workers",
  });
}
