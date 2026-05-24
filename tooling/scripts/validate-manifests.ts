import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { validateAppManifest } from "../../packages/contracts/src/app-manifest";

const appsDir = join(process.cwd(), "apps");
const appNames = readdirSync(appsDir).filter((name) => {
  const path = join(appsDir, name);
  return statSync(path).isDirectory() && name !== "gateway";
});

const manifests = await Promise.all(
  appNames.map(async (name) => {
    const moduleUrl = pathToFileURL(
      join(appsDir, name, "src/manifest.ts"),
    ).href;
    const mod = (await import(moduleUrl)) as { appManifest: unknown };
    return validateAppManifest(mod.appManifest);
  }),
);

const names = new Set<string>();
const failures: string[] = [];

for (const manifest of manifests) {
  if (names.has(manifest.name)) {
    failures.push("Duplicate manifest name " + manifest.name);
  }
  names.add(manifest.name);
}

if (failures.length > 0) {
  throw new Error("manifest validation failed:\n" + failures.join("\n"));
}

console.info("manifest validation passed for " + manifests.length + " apps");
