import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";

const root = process.cwd();
const failures: string[] = [];
const ignoredDirs = new Set([
  "node_modules",
  ".next",
  ".open-next",
  "dist",
  "coverage",
  "storybook-static",
  ".turbo",
]);
const importPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[^'"\n]+from\s+)?["']([^"']+)["']|import\(["']([^"']+)["']\)/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    if (ignoredDirs.has(entry)) {
      return [];
    }
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      return walk(path);
    }
    if (/\.(ts|tsx)$/.test(entry)) {
      return [path];
    }
    return [];
  });
}

function appNameFor(path: string): string | undefined {
  const parts = normalize(relative(root, path)).split(/[\\/]/);
  return parts[0] === "apps" ? parts[1] : undefined;
}

function resolveImport(file: string, specifier: string): string | undefined {
  if (specifier.startsWith(".")) {
    return normalize(resolve(dirname(file), specifier));
  }
  if (specifier.startsWith("apps/")) {
    return normalize(join(root, specifier));
  }
  return undefined;
}

for (const file of walk(root)) {
  const rel = normalize(relative(root, file));
  const source = readFileSync(file, "utf8");
  const currentApp = appNameFor(file);
  const isClient = /^["']use client["'];?/m.test(source);
  const isUiPackage = rel.startsWith("packages/ui/");
  const isContractsPackage = rel.startsWith("packages/contracts/");
  const isTokensPackage = rel.startsWith("packages/tokens/src/");

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2];
    if (!specifier) {
      continue;
    }

    const resolved = resolveImport(file, specifier);
    const targetApp = resolved ? appNameFor(resolved) : undefined;

    if (currentApp && targetApp && currentApp !== targetApp) {
      failures.push(
        rel + " imports from app " + targetApp + " via " + specifier,
      );
    }

    if ((isUiPackage || isContractsPackage) && targetApp) {
      failures.push(rel + " imports app code via " + specifier);
    }

    if (
      isTokensPackage &&
      !specifier.startsWith(".") &&
      !specifier.startsWith("tailwindcss")
    ) {
      failures.push(rel + " imports non-token dependency " + specifier);
    }

    if (
      isClient &&
      (specifier.includes("server-only") ||
        specifier.endsWith("/server") ||
        specifier.includes("/server/"))
    ) {
      failures.push(rel + " imports server-only module " + specifier);
    }
  }
}

if (failures.length > 0) {
  throw new Error("architecture validation failed:\n" + failures.join("\n"));
}

console.info("architecture validation passed");
