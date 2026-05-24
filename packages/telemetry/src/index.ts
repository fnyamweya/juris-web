import { createLogger } from "./logger";

export * from "./events";
export * from "./logger";
export * from "./request-context";
export * from "./web-vitals";

export type TelemetrySetupOptions = {
  serviceName: string;
  version?: string;
  appName?: string;
  runtime?: string;
};

export function initializeTelemetry(options: TelemetrySetupOptions): void {
  createLogger(options.serviceName).info("telemetry initialized", {
    "service.version": options.version,
    "app.name": options.appName,
    runtime: options.runtime,
  });
}
