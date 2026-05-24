import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "../../..");

const baseBranch =
  process.env.RELEASE_BASE_BRANCH ?? process.env.GITHUB_BASE_REF ?? "main";

try {
  const { stdout } = await execFileAsync(
    "git",
    ["diff", "--name-only", `origin/${baseBranch}...HEAD`],
    { cwd: workspaceRoot },
  );
  const changedFiles = stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  if (changedFiles.length === 0) {
    console.info("No changed files detected for changeset enforcement");
    process.exit(0);
  }

  const hasChangeset = changedFiles.some(
    (file) => file.startsWith(".changeset/") && file !== ".changeset/README.md",
  );

  if (hasChangeset) {
    console.info("Changeset detected for release-relevant changes");
    process.exit(0);
  }

  const releaseRelevantChanges = changedFiles.filter((file) =>
    isCodeChange(file),
  );

  if (releaseRelevantChanges.length === 0) {
    console.info("Only docs, release artifacts, or workflow files changed");
    process.exit(0);
  }

  throw new Error(
    `Release-relevant changes require a changeset.\nChanged files:\n- ${releaseRelevantChanges.join("\n- ")}\n\nRun \`pnpm exec changeset\` and commit the generated file.`,
  );
} catch (error) {
  if (
    error instanceof Error &&
    /not a git repository|ambiguous argument|unknown revision/i.test(
      error.message,
    )
  ) {
    console.warn(
      "Skipping changeset enforcement because git history is unavailable in this environment",
    );
    process.exit(0);
  }

  throw error;
}

function isCodeChange(file: string): boolean {
  if (
    file === "README.md" ||
    file.startsWith("docs/") ||
    file.startsWith(".github/") ||
    file === ".gitignore"
  ) {
    return false;
  }

  if (
    file === "CHANGELOG.md" ||
    file === "pnpm-lock.yaml" ||
    file.startsWith(".changeset/") ||
    /(^|\/)CHANGELOG\.md$/u.test(file) ||
    /(^|\/)package\.json$/u.test(file)
  ) {
    return false;
  }

  return (
    file.startsWith("apps/") ||
    file.startsWith("packages/") ||
    file.startsWith("tooling/") ||
    file === "package.json" ||
    file === "pnpm-workspace.yaml" ||
    file === "turbo.json" ||
    file === "playwright.config.ts" ||
    file === "tsconfig.json"
  );
}
