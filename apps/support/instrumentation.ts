import { initializeTelemetry } from "@repo/telemetry";
import packageMetadata from "./package.json";

export function register() {
  initializeTelemetry({
    serviceName: "web-support",
    version: packageMetadata.version,
    appName: "support",
    runtime: "cloudflare-workers",
  });
}
