import { validateAppManifest } from "@repo/contracts";
import { describe, expect, it } from "vitest";
import { appManifest } from "./manifest";

describe("Docs manifest", () => {
  it("is valid", () => {
    expect(validateAppManifest(appManifest).name).toBe("docs");
  });
});
