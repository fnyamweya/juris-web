import { initializeTelemetry } from "@repo/telemetry";
import packageMetadata from "./package.json";

export function register() {
  initializeTelemetry({
    serviceName: "web-public",
    version: packageMetadata.version,
    appName: "public",
    runtime: "cloudflare-workers",
  });
}
