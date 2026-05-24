import { initializeTelemetry } from "@repo/telemetry";
import packageMetadata from "./package.json";

export function register() {
  initializeTelemetry({
    serviceName: "web-console",
    version: packageMetadata.version,
    appName: "console",
    runtime: "cloudflare-workers",
  });
}
