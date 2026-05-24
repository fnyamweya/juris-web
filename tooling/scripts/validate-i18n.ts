import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function flatten(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nested]) =>
    flatten(nested, prefix ? prefix + "." + key : key),
  );
}

const messagesDir = join(process.cwd(), "packages/i18n/messages");
const files = readdirSync(messagesDir)
  .filter((file) => file.endsWith(".json"))
  .sort();
const [baseFile, ...restFiles] = files;

if (!baseFile) {
  throw new Error("No i18n message files found");
}

const baseKeys = new Set(
  flatten(JSON.parse(readFileSync(join(messagesDir, baseFile), "utf8"))),
);
const failures: string[] = [];

for (const file of restFiles) {
  const keys = new Set(
    flatten(JSON.parse(readFileSync(join(messagesDir, file), "utf8"))),
  );
  for (const key of baseKeys) {
    if (!keys.has(key)) {
      failures.push(file + " is missing " + key);
    }
  }
  for (const key of keys) {
    if (!baseKeys.has(key)) {
      failures.push(file + " has extra key " + key);
    }
  }
}

if (failures.length > 0) {
  throw new Error("i18n validation failed:\n" + failures.join("\n"));
}

console.info("i18n validation passed for " + files.length + " locales");
