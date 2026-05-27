import { execFile } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import {
  listDeployableApps,
  selectApps,
  workspaceRoot,
  type DeploymentEnvironment,
} from "./shared";

const execFileAsync = promisify(execFile);

type SelectionMode = "affected" | "all";

type CliOptions = {
  apps?: string[];
  baseRef?: string;
  environment: DeploymentEnvironment;
  headRef?: string;
  mode: SelectionMode;
};

type WorkspacePackage = {
  dependencies: string[];
  directory: string;
  name: string;
};

type DeploymentPlan = {
  apps: string[];
  apps_csv: string;
  changed_files: string[];
  deploy_all: boolean;
  gateway_required: boolean;
  has_apps: boolean;
  reasons: string[];
  smoke_required: boolean;
};

const deployableApps = listDeployableApps();
const deployableAppByPackageName = new Map(
  deployableApps.map((app) => [app.packageName, app] as const),
);
const workspacePackages = readWorkspacePackages();

await main();

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const plan = await createDeploymentPlan(options);
  console.info(JSON.stringify(plan));
}

async function createDeploymentPlan(
  options: CliOptions,
): Promise<DeploymentPlan> {
  if (options.apps && options.apps.length > 0) {
    const selected = selectApps(deployableApps, options.apps);
    const apps = selected
      .filter((app) => app.kind !== "gateway")
      .map((app) => app.slug)
      .sort();
    const gatewayRequired =
      options.environment === "preview"
        ? apps.length > 0 || selected.some((app) => app.kind === "gateway")
        : selected.some((app) => app.kind === "gateway");

    return {
      apps,
      apps_csv: apps.join(","),
      changed_files: [],
      deploy_all: false,
      gateway_required: gatewayRequired,
      has_apps: apps.length > 0,
      reasons: [`Explicit deployment selection: ${options.apps.join(", ")}`],
      smoke_required: apps.length > 0 || gatewayRequired,
    };
  }

  if (options.mode === "all") {
    const apps = deployableApps
      .filter((app) => app.kind !== "gateway")
      .map((app) => app.slug)
      .sort();

    return {
      apps,
      apps_csv: apps.join(","),
      changed_files: [],
      deploy_all: true,
      gateway_required: true,
      has_apps: apps.length > 0,
      reasons: ["Configured for full environment deployment"],
      smoke_required: true,
    };
  }

  const changedFiles = await getChangedFiles(options.baseRef, options.headRef);
  const analysis = analyzeChanges(changedFiles);

  if (analysis.deployAll) {
    const apps = deployableApps
      .filter((app) => app.kind !== "gateway")
      .map((app) => app.slug)
      .sort();

    return {
      apps,
      apps_csv: apps.join(","),
      changed_files: changedFiles,
      deploy_all: true,
      gateway_required: true,
      has_apps: apps.length > 0,
      reasons: analysis.reasons,
      smoke_required: true,
    };
  }

  const affectedWorkspaceNames = expandAffectedWorkspaceNames(
    analysis.changedWorkspaceNames,
  );
  const directlyAffectedDeployables = [...affectedWorkspaceNames]
    .map((packageName) => deployableAppByPackageName.get(packageName))
    .filter(Boolean);
  const gatewayRequired =
    directlyAffectedDeployables.some((app) => app.kind === "gateway") ||
    (options.environment === "preview" &&
      directlyAffectedDeployables.some((app) => app.kind !== "gateway"));
  const apps = directlyAffectedDeployables
    .filter((app) => app.kind !== "gateway")
    .map((app) => app.slug)
    .sort();

  return {
    apps,
    apps_csv: apps.join(","),
    changed_files: changedFiles,
    deploy_all: false,
    gateway_required: gatewayRequired,
    has_apps: apps.length > 0,
    reasons: analysis.reasons,
    smoke_required: apps.length > 0 || gatewayRequired,
  };
}

function analyzeChanges(changedFiles: string[]) {
  const changedWorkspaceNames = new Set<string>();
  const reasons: string[] = [];
  let deployAll = false;

  for (const filePath of changedFiles) {
    if (!filePath || isNonDeployChange(filePath)) {
      continue;
    }

    if (isDeploymentWideChange(filePath)) {
      deployAll = true;
      reasons.push(`Deployment-wide infrastructure changed: ${filePath}`);
      continue;
    }

    const workspacePackage = findWorkspacePackageForFile(filePath);
    if (!workspacePackage) {
      continue;
    }

    changedWorkspaceNames.add(workspacePackage.name);
  }

  if (
    !deployAll &&
    changedWorkspaceNames.size === 0 &&
    changedFiles.length > 0
  ) {
    reasons.push("No deployable runtime changes detected");
  }

  return {
    changedWorkspaceNames,
    deployAll,
    reasons,
  };
}

function expandAffectedWorkspaceNames(changedWorkspaceNames: Set<string>) {
  const reverseDependencies = buildReverseDependencyGraph(workspacePackages);
  const affected = new Set(changedWorkspaceNames);
  const queue = [...changedWorkspaceNames];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const dependents = reverseDependencies.get(current) ?? [];
    for (const dependent of dependents) {
      if (affected.has(dependent)) {
        continue;
      }

      affected.add(dependent);
      queue.push(dependent);
    }
  }

  return affected;
}

function buildReverseDependencyGraph(packages: WorkspacePackage[]) {
  const reverseDependencies = new Map<string, string[]>();

  for (const workspacePackage of packages) {
    for (const dependency of workspacePackage.dependencies) {
      const dependents = reverseDependencies.get(dependency) ?? [];
      dependents.push(workspacePackage.name);
      reverseDependencies.set(dependency, dependents);
    }
  }

  return reverseDependencies;
}

function readWorkspacePackages(): WorkspacePackage[] {
  const workspaceDirectories = ["apps", "packages"] as const;
  const packages: WorkspacePackage[] = [];

  for (const directory of workspaceDirectories) {
    const absoluteDirectory = path.join(workspaceRoot, directory);

    for (const entry of readdirSync(absoluteDirectory, {
      withFileTypes: true,
    })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const packageDirectory = path.join(absoluteDirectory, entry.name);
      const packageJsonPath = path.join(packageDirectory, "package.json");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
        dependencies?: Record<string, string>;
        name?: string;
        optionalDependencies?: Record<string, string>;
      };

      if (!packageJson.name) {
        continue;
      }

      packages.push({
        dependencies: [
          ...Object.keys(packageJson.dependencies ?? {}),
          ...Object.keys(packageJson.optionalDependencies ?? {}),
        ],
        directory: path.relative(workspaceRoot, packageDirectory),
        name: packageJson.name,
      });
    }
  }

  return packages;
}

function findWorkspacePackageForFile(filePath: string) {
  return workspacePackages.find(
    (workspacePackage) =>
      filePath === workspacePackage.directory ||
      filePath.startsWith(`${workspacePackage.directory}/`),
  );
}

async function getChangedFiles(baseRef?: string, headRef?: string) {
  if (!baseRef || !headRef) {
    return [];
  }

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["diff", "--name-only", `${baseRef}...${headRef}`],
      { cwd: workspaceRoot },
    );
    return stdout
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    const message = getErrorMessage(error);
    return message
      ? ["__DEPLOY_ALL__", `__ERROR__:${message.replace(/\s+/gu, " ").trim()}`]
      : ["__DEPLOY_ALL__"];
  }
}

function isDeploymentWideChange(filePath: string) {
  if (filePath === "__DEPLOY_ALL__" || filePath.startsWith("__ERROR__:")) {
    return true;
  }

  return (
    filePath === "package.json" ||
    filePath === "pnpm-lock.yaml" ||
    filePath === "pnpm-workspace.yaml" ||
    filePath === "turbo.json" ||
    filePath === ".github/actions/setup-monorepo/action.yml" ||
    filePath === ".github/workflows/_cloudflare-deploy.yml" ||
    filePath === ".github/workflows/deploy-preview.yml" ||
    filePath === ".github/workflows/deploy-staging.yml" ||
    filePath === ".github/workflows/deploy-production.yml" ||
    filePath === ".github/workflows/cleanup-preview.yml" ||
    filePath.startsWith("tooling/scripts/cloudflare/")
  );
}

function isNonDeployChange(filePath: string) {
  return (
    filePath === "README.md" ||
    filePath === "CHANGELOG.md" ||
    filePath.startsWith("docs/") ||
    filePath.startsWith(".changeset/") ||
    filePath === ".gitignore" ||
    filePath === ".prettierignore" ||
    filePath === ".github/workflows/ci.yml" ||
    filePath === ".github/workflows/release-pr.yml" ||
    filePath === ".github/workflows/publish-release.yml"
  );
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    environment: "preview",
    mode: "all",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case "--":
        break;
      case "--apps":
        options.apps = requireValue(arg, next)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        index += 1;
        break;
      case "--base-ref":
        options.baseRef = requireValue(arg, next);
        index += 1;
        break;
      case "--environment":
        options.environment = requireEnvironment(requireValue(arg, next));
        index += 1;
        break;
      case "--head-ref":
        options.headRef = requireValue(arg, next);
        index += 1;
        break;
      case "--mode":
        options.mode = requireMode(requireValue(arg, next));
        index += 1;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function requireEnvironment(value: string): DeploymentEnvironment {
  if (value !== "preview" && value !== "staging" && value !== "production") {
    throw new Error(
      `Invalid deployment environment "${value}". Expected preview, staging, or production.`,
    );
  }

  return value;
}

function requireMode(value: string): SelectionMode {
  if (value !== "affected" && value !== "all") {
    throw new Error(
      `Invalid deployment selection mode "${value}". Expected affected or all.`,
    );
  }

  return value;
}

function requireValue(flag: string, value: string | undefined) {
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }

  return value;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
