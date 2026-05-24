import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("merges conflicting classes", () => {
    expect(cn("px-2", "px-4", { hidden: false, block: true })).toBe(
      "px-4 block",
    );
  });
});
