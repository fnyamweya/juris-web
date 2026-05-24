import { initializeTelemetry } from "@repo/telemetry";
import packageMetadata from "./package.json";

export function register() {
  initializeTelemetry({
    serviceName: "web-settings",
    version: packageMetadata.version,
    appName: "settings",
    runtime: "cloudflare-workers",
  });
}
