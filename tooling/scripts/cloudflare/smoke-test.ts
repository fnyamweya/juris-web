import {
  assertCloudflareCredentials,
  createDeploymentContext,
  getWorkerName,
  getWorkerSubdomainState,
  getWorkersDevSubdomain,
  listDeployableApps,
  selectApps,
  type DeployableApp,
  type DeploymentEnvironment,
} from "./shared";
import { routeMap } from "../../../apps/gateway/src/route-map";

type CliOptions = {
  apps?: string[];
  environment: DeploymentEnvironment;
  expectGateway: boolean;
  expectGatewayRoutes: boolean;
  gitSha?: string;
  scope?: string;
  version?: string;
};

type JsonRecord = Record<string, unknown>;

const requestTimeoutMs = 15_000;
const retryDelayMs = 5_000;
const retryWindowMs = 180_000;

await main();

async function main() {
  const options = parseArgs(process.argv.slice(2));
  assertCloudflareCredentials();

  const deployableApps = listDeployableApps();
  const selectedApps =
    options.apps && options.apps.length > 0
      ? selectApps(
          deployableApps.filter((app) => app.kind !== "gateway"),
          options.apps,
        ).filter((app) => app.kind !== "gateway")
      : [];
  const gatewayApp = deployableApps.find((app) => app.slug === "gateway");
  if (!gatewayApp) {
    throw new Error("Gateway app is not deployable");
  }

  if (
    selectedApps.length === 0 &&
    !options.expectGateway &&
    !options.expectGatewayRoutes
  ) {
    console.info("No Cloudflare smoke tests requested");
    return;
  }

  const context = await createDeploymentContext({
    environment: options.environment,
    gitSha: options.gitSha,
    scope: options.scope,
    version: options.version,
  });
  const workersSubdomain = await getWorkersDevSubdomain();

  for (const app of selectedApps) {
    await smokeDirectWorker(
      app,
      workersSubdomain,
      context.version,
      context.gitSha,
      context.environment,
      context.scope,
    );
  }

  if (options.expectGateway || options.expectGatewayRoutes) {
    await smokeGatewayWorker(
      gatewayApp,
      selectedApps,
      workersSubdomain,
      context.version,
      context.gitSha,
      context.environment,
      context.scope,
      options.expectGateway,
    );
  }
}

async function smokeDirectWorker(
  app: DeployableApp,
  workersSubdomain: string,
  expectedVersion: string,
  expectedGitSha: string,
  environment: DeploymentEnvironment,
  scope?: string,
) {
  const workerName = getWorkerName(app, environment, scope);
  await assertWorkerSubdomainEnabled(workerName);

  const origin = `https://${workerName}.${workersSubdomain}.workers.dev`;
  await waitForJson(
    `${origin}/api/health/live`,
    `direct ${app.slug} live`,
    (payload) => {
      assertHealthyPayload(payload);
    },
  );
  await waitForJson(
    `${origin}/api/health/version`,
    `direct ${app.slug} version`,
    (payload) => {
      assertVersionPayload(payload, expectedVersion, expectedGitSha);
    },
  );
}

async function smokeGatewayWorker(
  gatewayApp: DeployableApp,
  selectedApps: DeployableApp[],
  workersSubdomain: string,
  expectedVersion: string,
  expectedGitSha: string,
  environment: DeploymentEnvironment,
  scope?: string,
  verifyGatewayMetadata = false,
) {
  const workerName = getWorkerName(gatewayApp, environment, scope);
  await assertWorkerSubdomainEnabled(workerName);

  const origin = `https://${workerName}.${workersSubdomain}.workers.dev`;
  if (verifyGatewayMetadata) {
    await waitForJson(
      `${origin}/api/health/live`,
      "gateway live",
      (payload) => {
        assertHealthyPayload(payload);
      },
    );
    await waitForJson(
      `${origin}/api/health/version`,
      "gateway version",
      (payload) => {
        assertVersionPayload(payload, expectedVersion, expectedGitSha);
      },
    );
  }

  for (const app of selectedApps) {
    const route = routeMap.find((candidate) => candidate.name === app.slug);
    if (!route) {
      throw new Error(`Gateway route is missing for ${app.slug}`);
    }

    const target = getGatewaySmokeTarget(route);
    if (target.expectJson) {
      await waitForJson(
        `${origin}${target.path}`,
        `gateway route ${app.slug}`,
        (payload) => {
          assertHealthyPayload(payload);
        },
      );
      continue;
    }

    await waitForResponse(
      `${origin}${target.path}`,
      `gateway route ${app.slug}`,
      (response, body) => {
        if (!response.ok) {
          throw new Error(
            `Expected a successful response but received ${response.status} ${response.statusText}: ${body.slice(0, 200)}`,
          );
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("text/html")) {
          throw new Error(
            `Expected HTML response for ${target.path}, received content-type "${contentType}"`,
          );
        }
      },
    );
  }
}

function getGatewaySmokeTarget(route: (typeof routeMap)[number]) {
  if (route.name === "public") {
    return {
      expectJson: false,
      path: "/en",
    };
  }

  const prefix =
    route.prefixes.find((candidate) => candidate !== "/") ?? route.prefixes[0];
  return {
    expectJson: true,
    path: `${prefix}/api/health/live`,
  };
}

async function assertWorkerSubdomainEnabled(workerName: string) {
  const state = await getWorkerSubdomainState(workerName);
  if (!state.enabled) {
    throw new Error(
      `Worker ${workerName} is not enabled on workers.dev; smoke tests cannot reach it`,
    );
  }
}

async function waitForJson(
  url: string,
  label: string,
  validate: (payload: JsonRecord) => void,
) {
  await waitForResponse(url, label, async (response, body) => {
    if (!response.ok) {
      throw new Error(
        `Expected a successful response but received ${response.status} ${response.statusText}: ${body.slice(0, 200)}`,
      );
    }

    let payload: JsonRecord;
    try {
      payload = JSON.parse(body) as JsonRecord;
    } catch (error) {
      throw new Error(
        `Expected JSON response for ${label}, received: ${body.slice(0, 200)}`,
        { cause: error },
      );
    }

    validate(payload);
  });
}

async function waitForResponse(
  url: string,
  label: string,
  validate: (response: Response, body: string) => void | Promise<void>,
) {
  const deadline = Date.now() + retryWindowMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
      const response = await fetch(url, {
        headers: {
          "user-agent": "juris-cloudflare-smoke-test",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const body = await response.text();
      await validate(response, body);
      console.info(`Verified ${label}: ${url}`);
      return;
    } catch (error) {
      lastError = error;
      await sleep(retryDelayMs);
    }
  }

  throw new Error(
    `Smoke test failed for ${label}: ${getErrorMessage(lastError)}`,
  );
}

function assertHealthyPayload(payload: JsonRecord) {
  if (payload.status !== "healthy") {
    throw new Error(
      `Expected status "healthy", received "${String(payload.status)}"`,
    );
  }
}

function assertVersionPayload(
  payload: JsonRecord,
  expectedVersion: string,
  expectedGitSha: string,
) {
  if (payload.version !== expectedVersion) {
    throw new Error(
      `Expected version "${expectedVersion}", received "${String(payload.version)}"`,
    );
  }

  if (payload.gitSha !== expectedGitSha) {
    throw new Error(
      `Expected gitSha "${expectedGitSha}", received "${String(payload.gitSha)}"`,
    );
  }
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    environment: "preview",
    expectGateway: false,
    expectGatewayRoutes: false,
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
      case "--expect-gateway":
        options.expectGateway = true;
        break;
      case "--expect-gateway-routes":
        options.expectGatewayRoutes = true;
        break;
      case "--git-sha":
        options.gitSha = requireValue(arg, next);
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

function sleep(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}
