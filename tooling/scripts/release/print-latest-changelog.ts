import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "../../..");
const changelogPath = path.join(workspaceRoot, "CHANGELOG.md");
const changelog = readFileSync(changelogPath, "utf8");

const match =
  /^## [^\n]+\n\n([\s\S]*?)(?=\n## |\s*$)/u.exec(changelog) ??
  /^# Changelog\n\n([\s\S]*)$/u.exec(changelog);

if (!match) {
  throw new Error("Could not extract the latest changelog entry");
}

process.stdout.write(match[1].trimEnd());
