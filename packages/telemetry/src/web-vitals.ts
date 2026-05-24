import { createLogger } from "./logger";

export type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
};

export function reportWebVitals(
  serviceName: string,
  metric: WebVitalMetric,
): void {
  createLogger(serviceName).info("web vital", {
    "web_vital.id": metric.id,
    "web_vital.name": metric.name,
    "web_vital.value": metric.value,
    "web_vital.rating": metric.rating,
  });
}
