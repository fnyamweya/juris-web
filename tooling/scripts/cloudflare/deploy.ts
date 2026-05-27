import {
  assertCloudflareCredentials,
  createDeploymentContext,
  ensureWorkerSubdomainEnabled,
  getCommandEnvironment,
  getWorkerName,
  listExistingScopedApps,
  listDeployableApps,
  materializeWranglerConfig,
  runCommand,
  selectApps,
  type DeployableApp,
  type DeploymentEnvironment,
} from "./shared";

type CliOptions = {
  apps?: string[];
  environment: DeploymentEnvironment;
  scope?: string;
  version?: string;
  gitSha?: string;
  buildTime?: string;
  bindApps?: string[];
  skipBuild: boolean;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  assertCloudflareCredentials();

  const availableApps = listDeployableApps();
  const selectedApps = selectApps(availableApps, options.apps);
  const context = await createDeploymentContext({
    environment: options.environment,
    scope: options.scope,
    version: options.version,
    gitSha: options.gitSha,
    buildTime: options.buildTime,
  });
  const env = getCommandEnvironment(context);

  for (const app of selectedApps) {
    console.info(
      `\nDeploying ${app.slug} to ${context.environment} (${context.version})`,
    );

    const wranglerConfigPath = await materializeWranglerConfig(app, context, {
      serviceApps: await resolveGatewayServiceApps(
        app,
        availableApps,
        context,
        options.bindApps,
      ),
    });

    if (!options.skipBuild) {
      await buildApp(app, env);
    }

    await deployApp(app, wranglerConfigPath, env);
    await ensureWorkerSubdomainEnabled(
      getWorkerName(app, context.environment, context.scope),
    );
  }
}

async function resolveGatewayServiceApps(
  app: DeployableApp,
  availableApps: DeployableApp[],
  context: {
    environment: DeploymentEnvironment;
    scope?: string;
  },
  bindApps: string[] | undefined,
) {
  if (app.kind !== "gateway") {
    return undefined;
  }

  const deployableWorkers = availableApps.filter(
    (candidate) => candidate.kind !== "gateway",
  );

  if (context.environment !== "preview") {
    return deployableWorkers;
  }

  const explicitlyBoundApps =
    bindApps && bindApps.length > 0
      ? selectApps(deployableWorkers, bindApps).filter(
          (candidate) => candidate.kind !== "gateway",
        )
      : [];
  const existingPreviewApps = await listExistingScopedApps(
    context.environment,
    context.scope,
  );
  const mergedApps = new Map<string, DeployableApp>();

  for (const candidate of [...existingPreviewApps, ...explicitlyBoundApps]) {
    mergedApps.set(candidate.slug, candidate);
  }

  return [...mergedApps.values()].sort((left, right) =>
    left.slug.localeCompare(right.slug),
  );
}

async function buildApp(app: DeployableApp, env: NodeJS.ProcessEnv) {
  if (app.kind === "gateway") {
    await runCommand("pnpm", ["exec", "tsc", "-p", "tsconfig.json"], {
      cwd: app.directory,
      env,
    });
    return;
  }

  await runCommand("pnpm", ["exec", "opennextjs-cloudflare", "build"], {
    cwd: app.directory,
    env,
  });
}

async function deployApp(
  app: DeployableApp,
  wranglerConfigPath: string,
  env: NodeJS.ProcessEnv,
) {
  if (app.kind === "gateway") {
    await runCommand(
      "pnpm",
      ["exec", "wrangler", "deploy", "--config", wranglerConfigPath],
      {
        cwd: app.directory,
        env,
      },
    );
    return;
  }

  await runCommand(
    "pnpm",
    ["exec", "opennextjs-cloudflare", "deploy", "--config", wranglerConfigPath],
    {
      cwd: app.directory,
      env,
    },
  );
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    environment: "preview",
    skipBuild: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case "--":
        break;
      case "--apps":
      case "--app":
        options.apps = parseList(requireValue(arg, next));
        index += 1;
        break;
      case "--environment":
        options.environment = requireEnvironment(requireValue(arg, next));
        index += 1;
        break;
      case "--scope":
        options.scope = requireValue(arg, next);
        index += 1;
        break;
      case "--version":
        options.version = requireValue(arg, next);
        index += 1;
        break;
      case "--git-sha":
        options.gitSha = requireValue(arg, next);
        index += 1;
        break;
      case "--build-time":
        options.buildTime = requireValue(arg, next);
        index += 1;
        break;
      case "--bind-apps":
        options.bindApps = parseList(requireValue(arg, next));
        index += 1;
        break;
      case "--skip-build":
        options.skipBuild = true;
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

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function requireValue(flag: string, value: string | undefined) {
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }

  return value;
}

await main();
