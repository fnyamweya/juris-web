import {
  assertCloudflareCredentials,
  getCommandEnvironment,
  getWorkerName,
  listDeployableApps,
  runCommandCapture,
  selectApps,
  type DeployableApp,
  type DeploymentEnvironment,
} from "./shared";

type CliOptions = {
  apps?: string[];
  environment: DeploymentEnvironment;
  scope?: string;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  assertCloudflareCredentials();

  const allApps = listDeployableApps();
  const selectedApps = selectApps(allApps, options.apps).sort((left, right) =>
    left.kind === right.kind
      ? left.slug.localeCompare(right.slug)
      : left.kind === "gateway"
        ? -1
        : 1,
  );
  const env = getCommandEnvironment({
    environment: options.environment,
    scope: options.scope,
    version: process.env.NEXT_PUBLIC_PLATFORM_VERSION ?? "0.0.0",
    gitSha: process.env.GITHUB_SHA?.slice(0, 12) ?? "cleanup",
    buildTime: new Date().toISOString(),
  });

  for (const app of selectedApps) {
    const workerName = getWorkerName(app, options.environment, options.scope);

    try {
      console.info(`Deleting ${workerName}`);
      await runCommandCapture(
        "pnpm",
        ["exec", "wrangler", "delete", workerName, "--force"],
        {
          cwd: app.directory,
          env,
        },
      );
    } catch (error) {
      const message = getErrorMessage(error);

      if (
        /does not exist|not found|missing|there is no service/i.test(message)
      ) {
        console.warn(`Worker ${workerName} does not exist, skipping`);
        continue;
      }

      throw error;
    }
  }
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    environment: "preview",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case "--":
        break;
      case "--apps":
      case "--app":
        options.apps = requireValue(arg, next)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
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

await main();
