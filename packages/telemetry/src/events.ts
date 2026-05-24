import { trace } from "@opentelemetry/api";
import { createLogger } from "./logger";

export type TelemetryEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

export function trackEvent(serviceName: string, event: TelemetryEvent): void {
  const logger = createLogger(serviceName);
  const span = trace.getActiveSpan();
  logger.info("event tracked", {
    event: event.name,
    properties: event.properties,
    "trace.id": span?.spanContext().traceId,
  });
}
