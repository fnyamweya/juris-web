import { initializeTelemetry } from "@repo/telemetry";
import packageMetadata from "./package.json";

export function register() {
  initializeTelemetry({
    serviceName: "web-billing",
    version: packageMetadata.version,
    appName: "billing",
    runtime: "cloudflare-workers",
  });
}
