import { describe, expect, it } from "vitest";
import { resolveRoute } from "./route-map";

describe("gateway route map", () => {
  it("resolves product paths", () => {
    expect(resolveRoute("/en/console")?.name).toBe("console");
    expect(resolveRoute("/en/billing/invoices")?.name).toBe("billing");
    expect(resolveRoute("/en/login")?.name).toBe("identity");
    expect(resolveRoute("/en")?.name).toBe("public");
  });
});
