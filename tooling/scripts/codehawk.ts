import { spawnSync } from "node:child_process";

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
const EXIT_SKIPPED = 0;

function log(message: string): void {
  console.info(`[codehawk] ${message}`);
}

function fail(message: string): never {
  console.error(`[codehawk] ${message}`);
  process.exit(EXIT_FAILURE);
}

function readStringEnv(name: string, defaultValue = ""): string {
  return process.env[name]?.trim() || defaultValue;
}

function readBooleanEnv(name: string, defaultValue = false): boolean {
  const value = process.env[name];

  if (value == null || value === "") {
    return defaultValue;
  }

  if (value === "true") return true;
  if (value === "false") return false;

  fail(
    `${name} must be either "true" or "false". Received: ${JSON.stringify(
      value,
    )}`,
  );
}

function parseJsonStringArray(name: string, value: string): string[] {
  if (!value.trim()) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    fail(
      `${name} must be valid JSON. Example: ${name}='["analyze","--format","sarif"]'`,
    );
  }

  if (!Array.isArray(parsed)) {
    fail(`${name} must be a JSON array of strings.`);
  }

  const invalidItem = parsed.find((item) => typeof item !== "string");

  if (invalidItem !== undefined) {
    fail(
      `${name} must contain only strings. Invalid item: ${JSON.stringify(
        invalidItem,
      )}`,
    );
  }

  return parsed as string[];
}

function main(): void {
  const enabled = readBooleanEnv("CODEHAWK_ENABLED", false);
  const dryRun = readBooleanEnv("CODEHAWK_DRY_RUN", false);
  const requiredInCi = readBooleanEnv(
    "CODEHAWK_REQUIRED_IN_CI",
    process.env.CI === "true",
  );

  const bin = readStringEnv("CODEHAWK_BIN");
  const args = parseJsonStringArray(
    "CODEHAWK_ARGS",
    readStringEnv("CODEHAWK_ARGS", "[]"),
  );
  const cwd = readStringEnv("CODEHAWK_CWD", process.cwd());

  if (!enabled) {
    if (requiredInCi) {
      fail(
        "CODEHAWK_ENABLED=false, but Codehawk is required in CI. " +
          "Set CODEHAWK_ENABLED=true or explicitly set CODEHAWK_REQUIRED_IN_CI=false.",
      );
    }

    log("Skipped. Set CODEHAWK_ENABLED=true to run analysis.");
    process.exit(EXIT_SKIPPED);
  }

  if (!bin) {
    fail(
      "CODEHAWK_ENABLED=true but CODEHAWK_BIN is not configured. " +
        "Example: CODEHAWK_BIN=codehawk",
    );
  }

  log("Enabled.");
  log(`Command: ${bin} ${args.join(" ")}`);
  log(`Working directory: ${cwd}`);

  if (dryRun) {
    log("Dry run enabled. Command was not executed.");
    process.exit(EXIT_SUCCESS);
  }

  const result = spawnSync(bin, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      FORCE_COLOR: process.env.FORCE_COLOR ?? "1",
    },
  });

  if (result.error) {
    fail(`Failed to start Codehawk command: ${result.error.message}`);
  }

  if (result.signal) {
    fail(`Codehawk terminated by signal: ${result.signal}`);
  }

  if (result.status !== 0) {
    fail(`Codehawk failed with exit code ${result.status ?? "unknown"}.`);
  }

  log("Analysis completed successfully.");
}

main();
