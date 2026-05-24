import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "./format";

describe("format helpers", () => {
  it("formats locale aware values", () => {
    expect(formatCurrency(1200, "en")).toContain("$");
    expect(formatNumber(1200, "fr")).toContain("1");
    expect(formatPercent(0.124, "en")).toBe("12.4%");
    expect(formatDate("2026-05-23T10:00:00.000Z", "en")).toContain("2026");
  });
});
