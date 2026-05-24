import { initializeTelemetry } from "@repo/telemetry";
import packageMetadata from "./package.json";

export function register() {
  initializeTelemetry({
    serviceName: "web-reporting",
    version: packageMetadata.version,
    appName: "reporting",
    runtime: "cloudflare-workers",
  });
}
