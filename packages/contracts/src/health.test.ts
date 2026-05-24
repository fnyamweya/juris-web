import { describe, expect, it } from "vitest";
import { HealthResponseSchema } from "./health";

describe("HealthResponseSchema", () => {
  it("accepts a healthy response", () => {
    expect(
      HealthResponseSchema.parse({
        status: "healthy",
        service: "web-console",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
      }).status,
    ).toBe("healthy");
  });
});
