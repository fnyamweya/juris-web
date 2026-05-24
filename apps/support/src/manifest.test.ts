import { validateAppManifest } from "@repo/contracts";
import { describe, expect, it } from "vitest";
import { appManifest } from "./manifest";

describe("support manifest", () => {
  it("is valid", () => {
    expect(validateAppManifest(appManifest).name).toBe("support");
  });
});
