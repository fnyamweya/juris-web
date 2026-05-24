import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runCommand, workspaceRoot } from "../cloudflare/shared";

type PendingChangeset = {
  fileName: string;
  summary: string;
  releases: Map<string, ReleaseType>;
};

type ReleaseType = "major" | "minor" | "patch";

const changesetDirectory = path.join(workspaceRoot, ".changeset");
const rootPackageJsonPath = path.join(workspaceRoot, "package.json");
const rootChangelogPath = path.join(workspaceRoot, "CHANGELOG.md");
const envExamplePath = path.join(workspaceRoot, ".env.example");

const pendingChangesets = readPendingChangesets();

if (pendingChangesets.length === 0) {
  console.info("No pending changesets found");
  process.exit(0);
}

await runCommand("pnpm", ["exec", "changeset", "version"], {
  cwd: workspaceRoot,
});

const version = getCanonicalWorkspaceVersion();
syncRootPackageVersion(version);
syncRootChangelog(version, pendingChangesets);
syncEnvExample(version);

console.info(`Release metadata synchronized for ${version}`);

function readPendingChangesets(): PendingChangeset[] {
  return readdirSync(changesetDirectory)
    .filter((fileName) => fileName.endsWith(".md") && fileName !== "README.md")
    .map((fileName) => {
      const absolutePath = path.join(changesetDirectory, fileName);
      const source = readFileSync(absolutePath, "utf8");
      const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/u.exec(source);

      if (!match) {
        throw new Error(`Invalid changeset format: ${fileName}`);
      }

      return {
        fileName,
        summary: normalizeSummary(match[2]),
        releases: parseReleases(match[1]),
      };
    });
}

function parseReleases(frontMatter: string): Map<string, ReleaseType> {
  const releases = new Map<string, ReleaseType>();

  for (const line of frontMatter.split(/\r?\n/u)) {
    const match = /^"([^"]+)":\s*(major|minor|patch)$/u.exec(line.trim());
    if (!match) {
      continue;
    }

    releases.set(match[1], match[2] as ReleaseType);
  }

  return releases;
}

function getCanonicalWorkspaceVersion() {
  const versions = new Set<string>();

  for (const directory of ["apps", "packages"] as const) {
    const absoluteDirectory = path.join(workspaceRoot, directory);

    for (const name of readdirSync(absoluteDirectory)) {
      const packageJsonPath = path.join(
        absoluteDirectory,
        name,
        "package.json",
      );
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
        version?: string;
      };

      if (!packageJson.version) {
        continue;
      }

      versions.add(packageJson.version);
    }
  }

  if (versions.size !== 1) {
    throw new Error(
      `Expected a single fixed release version, found: ${[...versions].join(", ")}`,
    );
  }

  return [...versions][0];
}

function syncRootPackageVersion(version: string) {
  const packageJson = JSON.parse(readFileSync(rootPackageJsonPath, "utf8")) as {
    version?: string;
  };
  packageJson.version = version;
  writeJson(rootPackageJsonPath, packageJson);
}

function syncRootChangelog(version: string, changesets: PendingChangeset[]) {
  const currentChangelog = readIfExists(rootChangelogPath);
  const entry = buildChangelogEntry(version, changesets);

  if (currentChangelog.includes(`## ${version}\n`)) {
    return;
  }

  const nextChangelog = currentChangelog.startsWith("# Changelog")
    ? currentChangelog.replace(/^# Changelog\n\n/u, `# Changelog\n\n${entry}`)
    : `# Changelog\n\n${entry}${currentChangelog}`;

  writeFileSync(rootChangelogPath, nextChangelog);
}

function syncEnvExample(version: string) {
  const source = readIfExists(envExamplePath);
  const next = source.replace(
    /^NEXT_PUBLIC_PLATFORM_VERSION=.*$/mu,
    `NEXT_PUBLIC_PLATFORM_VERSION=${version}`,
  );

  if (next !== source) {
    writeFileSync(envExamplePath, next);
  }
}

function buildChangelogEntry(version: string, changesets: PendingChangeset[]) {
  const summaryLines = changesets
    .map((changeset) => changeset.summary)
    .filter(Boolean)
    .map((summary) => `- ${summary}`);
  const releaseLines = [...collapseReleaseTypes(changesets).entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([packageName, releaseType]) => `- ${packageName} (${releaseType})`);
  const date = new Date().toISOString().slice(0, 10);

  return [
    `## ${version}`,
    ``,
    `Released on ${date}.`,
    ``,
    `### Highlights`,
    ``,
    ...(summaryLines.length > 0
      ? summaryLines
      : ["- No release notes provided."]),
    ``,
    `### Release Scope`,
    ``,
    ...(releaseLines.length > 0
      ? releaseLines
      : ["- No workspace packages were updated."]),
    ``,
  ].join("\n");
}

function collapseReleaseTypes(changesets: PendingChangeset[]) {
  const rankings: Record<ReleaseType, number> = {
    patch: 1,
    minor: 2,
    major: 3,
  };
  const releases = new Map<string, ReleaseType>();

  for (const changeset of changesets) {
    for (const [packageName, releaseType] of changeset.releases.entries()) {
      const current = releases.get(packageName);
      if (!current || rankings[releaseType] > rankings[current]) {
        releases.set(packageName, releaseType);
      }
    }
  }

  return releases;
}

function normalizeSummary(value: string) {
  return value
    .trim()
    .replace(/\r?\n+/gu, " ")
    .replace(/\s+/gu, " ");
}

function readIfExists(filePath: string) {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function writeJson(filePath: string, data: unknown) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}
