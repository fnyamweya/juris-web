import { validateAppManifest } from "@repo/contracts";
import { describe, expect, it } from "vitest";
import { appManifest } from "./manifest";

describe("admin manifest", () => {
  it("is valid", () => {
    expect(validateAppManifest(appManifest).name).toBe("admin");
  });
});
