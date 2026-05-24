import { initializeTelemetry } from "@repo/telemetry";
import packageMetadata from "./package.json";

export function register() {
  initializeTelemetry({
    serviceName: "web-identity",
    version: packageMetadata.version,
    appName: "identity",
    runtime: "cloudflare-workers",
  });
}
