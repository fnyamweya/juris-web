import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  routeMap,
  type GatewayRoute,
} from "../../../apps/gateway/src/route-map";

const execFileAsync = promisify(execFile);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const workspaceRoot = path.resolve(scriptDir, "../../..");
const appsDirectory = path.join(workspaceRoot, "apps");
const rootPackageJsonPath = path.join(workspaceRoot, "package.json");

export type DeploymentEnvironment = "preview" | "staging" | "production";
export type DeployKind = "gateway" | "opennext";
type WranglerAssets = {
  directory: string;
  binding: string;
};

type WranglerService = {
  binding: string;
  service: string;
  entrypoint?: string;
  props?: Record<string, unknown>;
  remote?: boolean;
};

type WranglerConfig = {
  name: string;
  main: string;
  compatibility_date: string;
  compatibility_flags?: string[];
  assets?: WranglerAssets;
  observability?: {
    enabled?: boolean;
  };
  vars?: Record<string, string>;
  services?: WranglerService[];
};

export type DeployableApp = {
  slug: string;
  packageName: string;
  directory: string;
  kind: DeployKind;
  baseWorkerName: string;
  binding?: GatewayRoute["binding"];
  wranglerPath: string;
};

export type DeploymentContext = {
  environment: DeploymentEnvironment;
  scope?: string;
  version: string;
  gitSha: string;
  buildTime: string;
};

type CommandOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

const defaultNextWranglerConfig: WranglerConfig = {
  name: "juris-app",
  main: ".open-next/worker.js",
  compatibility_date: "2026-05-23",
  compatibility_flags: ["nodejs_compat"],
  assets: {
    directory: ".open-next/assets",
    binding: "ASSETS",
  },
  observability: {
    enabled: true,
  },
};

const defaultGatewayWranglerConfig: WranglerConfig = {
  name: "juris-gateway",
  main: "src/worker.ts",
  compatibility_date: "2026-05-23",
  compatibility_flags: ["nodejs_compat"],
  observability: {
    enabled: true,
  },
};

export function isDeploymentEnvironment(
  value: string | undefined,
): value is DeploymentEnvironment {
  return value === "preview" || value === "staging" || value === "production";
}

export function readRootPackageVersion(): string {
  const packageJson = JSON.parse(readFileSync(rootPackageJsonPath, "utf8")) as {
    version?: string;
  };

  if (!packageJson.version) {
    throw new Error("Root package.json is missing a version");
  }

  return packageJson.version;
}

export function getReleaseVersion(explicitVersion?: string): string {
  return normalizeVersion(
    explicitVersion ??
      process.env.NEXT_PUBLIC_PLATFORM_VERSION ??
      readRootPackageVersion(),
  );
}

export async function getGitSha(explicitSha?: string): Promise<string> {
  if (explicitSha) {
    return explicitSha;
  }

  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 12);
  }

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["rev-parse", "--short=12", "HEAD"],
      {
        cwd: workspaceRoot,
      },
    );
    return stdout.trim() || "local";
  } catch {
    return "local";
  }
}

export function getBuildTime(explicitBuildTime?: string): string {
  return explicitBuildTime ?? new Date().toISOString();
}

export function listDeployableApps(): DeployableApp[] {
  const bindingBySlug = new Map(
    routeMap.map((route) => [route.name, route.binding] as const),
  );

  const apps = readdirSync(appsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .flatMap((slug) => {
      const directory = path.join(appsDirectory, slug);
      const packageJsonPath = path.join(directory, "package.json");

      if (!existsSync(packageJsonPath)) {
        return [];
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
        name?: string;
        scripts?: Record<string, string>;
      };

      const scripts = packageJson.scripts ?? {};
      const kind =
        slug === "gateway"
          ? "gateway"
          : "deploy:cloudflare" in scripts
            ? "opennext"
            : null;

      if (!kind || !packageJson.name) {
        return [];
      }

      const wranglerJsonPath = path.join(directory, "wrangler.jsonc");
      const wranglerTomlPath = path.join(directory, "wrangler.toml");
      const wranglerPath = existsSync(wranglerJsonPath)
        ? wranglerJsonPath
        : existsSync(wranglerTomlPath)
          ? wranglerTomlPath
          : wranglerJsonPath;
      const baseConfig = readWranglerConfig(wranglerPath, kind, slug);

      return [
        {
          slug,
          packageName: packageJson.name,
          directory,
          kind,
          baseWorkerName: baseConfig.name,
          binding: bindingBySlug.get(slug),
          wranglerPath,
        } satisfies DeployableApp,
      ];
    });

  return apps.sort((left, right) => left.slug.localeCompare(right.slug));
}

export function selectApps(
  availableApps: DeployableApp[],
  requestedApps: string[] | undefined,
): DeployableApp[] {
  if (!requestedApps || requestedApps.length === 0) {
    return availableApps;
  }

  const requested = new Set(
    requestedApps.map((value) => value.trim()).filter(Boolean),
  );
  const selected = availableApps.filter(
    (app) => requested.has(app.slug) || requested.has(app.packageName),
  );

  const missing = [...requested].filter(
    (name) =>
      !selected.some((app) => app.slug === name || app.packageName === name),
  );

  if (missing.length > 0) {
    throw new Error(`Unknown deployable app selection: ${missing.join(", ")}`);
  }

  return selected;
}

export function createDeploymentContext(options: {
  environment: DeploymentEnvironment;
  scope?: string;
  version?: string;
  gitSha?: string;
  buildTime?: string;
}): Promise<DeploymentContext> {
  return Promise.all([
    Promise.resolve(getReleaseVersion(options.version)),
    getGitSha(options.gitSha),
  ]).then(([version, gitSha]) => ({
    environment: options.environment,
    scope: options.scope,
    version,
    gitSha,
    buildTime: getBuildTime(options.buildTime),
  }));
}

export function getCommandEnvironment(
  context: DeploymentContext,
): NodeJS.ProcessEnv {
  return {
    ...process.env,
    APP_ENV: context.environment,
    NEXT_PUBLIC_APP_ENV: context.environment,
    PLATFORM_VERSION: context.version,
    NEXT_PUBLIC_PLATFORM_VERSION: context.version,
    GIT_SHA: context.gitSha,
    BUILD_TIME: context.buildTime,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CF_ACCOUNT_ID:
      process.env.CF_ACCOUNT_ID ?? process.env.CLOUDFLARE_ACCOUNT_ID,
    CF_API_TOKEN: process.env.CF_API_TOKEN ?? process.env.CLOUDFLARE_API_TOKEN,
  };
}

export function assertCloudflareCredentials() {
  const missing = [
    process.env.CLOUDFLARE_ACCOUNT_ID ? null : "CLOUDFLARE_ACCOUNT_ID",
    process.env.CLOUDFLARE_API_TOKEN ? null : "CLOUDFLARE_API_TOKEN",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Cloudflare credentials: ${missing.join(", ")}`,
    );
  }
}

export async function materializeWranglerConfig(
  app: DeployableApp,
  context: DeploymentContext,
): Promise<string> {
  const targetDirectory = path.join(
    workspaceRoot,
    ".cloudflare",
    "generated",
    context.environment,
    getWorkerScopeSegment(context.environment, context.scope),
  );
  await mkdir(targetDirectory, { recursive: true });

  const config = createWranglerConfig(app, context);
  const targetPath = path.join(targetDirectory, `${app.slug}.wrangler.jsonc`);
  await writeFile(targetPath, `${JSON.stringify(config, null, 2)}\n`);

  return targetPath;
}

export function getWorkerName(
  app: Pick<DeployableApp, "baseWorkerName">,
  environment: DeploymentEnvironment,
  scope?: string,
): string {
  if (environment === "production") {
    return app.baseWorkerName;
  }

  const scopeSegment = getWorkerScopeSegment(environment, scope);
  return truncateWorkerName(`${app.baseWorkerName}-${scopeSegment}`);
}

export function getWorkerScopeSegment(
  environment: DeploymentEnvironment,
  scope?: string,
): string {
  if (environment === "production") {
    return "production";
  }

  if (environment === "staging") {
    return "staging";
  }

  return `preview-${sanitizeScope(scope ?? process.env.GITHUB_HEAD_REF ?? process.env.GITHUB_REF_NAME ?? "shared")}`;
}

export async function runCommand(
  command: string,
  args: string[],
  options: CommandOptions = {},
) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? workspaceRoot,
      env: options.env ?? process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Command failed (${code ?? "unknown"}): ${command} ${args.join(" ")}`,
        ),
      );
    });
  });
}

export async function runCommandCapture(
  command: string,
  args: string[],
  options: CommandOptions = {},
) {
  return execFileAsync(command, args, {
    cwd: options.cwd ?? workspaceRoot,
    env: options.env ?? process.env,
  });
}

function createWranglerConfig(
  app: DeployableApp,
  context: DeploymentContext,
): WranglerConfig {
  const baseConfig = readWranglerConfig(app.wranglerPath, app.kind, app.slug);
  const config: WranglerConfig = {
    ...baseConfig,
    name: getWorkerName(app, context.environment, context.scope),
    main: absolutizeWorkerPath(app.directory, baseConfig.main),
    vars: {
      ...(baseConfig.vars ?? {}),
      APP_ENV: context.environment,
      NEXT_PUBLIC_APP_ENV: context.environment,
      PLATFORM_VERSION: context.version,
      NEXT_PUBLIC_PLATFORM_VERSION: context.version,
      GIT_SHA: context.gitSha,
      BUILD_TIME: context.buildTime,
    },
  };

  if (app.kind === "gateway") {
    config.services = routeMap.map((route) => ({
      binding: route.binding,
      service: getWorkerName(
        {
          baseWorkerName: getBaseWorkerNameForRoute(route),
        },
        context.environment,
        context.scope,
      ),
    }));
  }

  if (baseConfig.assets) {
    config.assets = {
      ...baseConfig.assets,
      directory: absolutizeWorkerPath(
        app.directory,
        baseConfig.assets.directory,
      ),
    };
  }

  return config;
}

function getBaseWorkerNameForRoute(route: GatewayRoute): string {
  const mappedApp = listDeployableApps().find((app) => app.slug === route.name);

  if (!mappedApp) {
    throw new Error(`Gateway route "${route.name}" has no deployable app`);
  }

  return mappedApp.baseWorkerName;
}

function readWranglerConfig(
  wranglerPath: string,
  kind: DeployKind,
  slug: string,
): WranglerConfig {
  if (!existsSync(wranglerPath)) {
    return kind === "gateway"
      ? { ...defaultGatewayWranglerConfig }
      : {
          ...defaultNextWranglerConfig,
          name: `juris-${slug}`,
        };
  }

  if (wranglerPath.endsWith(".jsonc")) {
    const parsed = parseJsonc(
      readFileSync(wranglerPath, "utf8"),
    ) as WranglerConfig;
    return {
      ...(kind === "gateway"
        ? defaultGatewayWranglerConfig
        : { ...defaultNextWranglerConfig, name: `juris-${slug}` }),
      ...parsed,
    };
  }

  const parsed = parseToml(readFileSync(wranglerPath, "utf8"));
  return {
    ...(kind === "gateway"
      ? defaultGatewayWranglerConfig
      : { ...defaultNextWranglerConfig, name: `juris-${slug}` }),
    ...parsed,
  };
}

function parseJsonc(source: string): unknown {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const withoutLineComments = withoutBlockComments.replace(/^\s*\/\/.*$/gm, "");
  const withoutTrailingCommas = withoutLineComments.replace(
    /,\s*([}\]])/g,
    "$1",
  );

  return JSON.parse(withoutTrailingCommas);
}

function parseToml(source: string): WranglerConfig {
  const root: Record<string, unknown> = {};
  let current: Record<string, unknown> = root;

  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const tableMatch = /^\[(.+)\]$/u.exec(line);
    if (tableMatch) {
      current = ensureTomlTable(root, tableMatch[1].split("."));
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    current[key] = parseTomlValue(value);
  }

  return root as unknown as WranglerConfig;
}

function ensureTomlTable(
  root: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  let cursor = root;

  for (const key of keys) {
    const existing = cursor[key];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      cursor[key] = {};
    }

    cursor = cursor[key] as Record<string, unknown>;
  }

  return cursor;
}

function parseTomlValue(value: string): unknown {
  if (value === "true" || value === "false") {
    return value === "true";
  }

  if (value.startsWith('"') || value.startsWith("'")) {
    return JSON.parse(value.replace(/^'/u, '"').replace(/'$/u, '"'));
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    return JSON.parse(value);
  }

  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) {
    return asNumber;
  }

  return value;
}

function sanitizeScope(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "shared";
}

function normalizeVersion(value: string) {
  return /^v\d/u.test(value) ? value.slice(1) : value;
}

function absolutizeWorkerPath(appDirectory: string, targetPath: string) {
  return path.isAbsolute(targetPath)
    ? targetPath
    : path.join(appDirectory, targetPath);
}

function truncateWorkerName(name: string): string {
  if (name.length <= 63) {
    return name;
  }

  const hash = createHash("sha1").update(name).digest("hex").slice(0, 8);
  const prefix = name
    .slice(0, Math.max(0, 63 - hash.length - 1))
    .replace(/-$/u, "");
  return `${prefix}-${hash}`;
}
