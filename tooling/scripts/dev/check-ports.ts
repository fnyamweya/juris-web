import { execFile } from "node:child_process";
import net from "node:net";
import { promisify } from "node:util";
import { routeMap } from "../../../apps/gateway/src/route-map";

const execFileAsync = promisify(execFile);

type LocalService = {
  name: string;
  port: number;
};

type PortConflict = LocalService & {
  listeners: string[];
};

await main();

async function main() {
  if (shouldSkipCheck()) {
    console.info("Skipping local dev port preflight");
    return;
  }

  const services = getLocalServices();
  const conflicts = await findPortConflicts(services);

  if (conflicts.length === 0) {
    console.info(
      `Local dev port preflight passed for ${services.length} services`,
    );
    return;
  }

  console.error(
    "Local development cannot start because one or more required ports are already in use.",
  );

  for (const conflict of conflicts) {
    console.error(`- ${conflict.name} on :${conflict.port}`);
    if (conflict.listeners.length > 0) {
      for (const listener of conflict.listeners) {
        console.error(`  ${listener}`);
      }
    } else {
      console.error("  Listener details unavailable");
    }
  }

  console.error("");
  console.error("Stop the existing listeners and retry `pnpm dev`.");
  console.error("Inspect one port with: `lsof -nP -iTCP:<port> -sTCP:LISTEN`");
  console.error("Bypass once with: `SKIP_DEV_PORT_CHECK=1 pnpm dev`");
  process.exit(1);
}

async function findPortConflicts(
  services: LocalService[],
): Promise<PortConflict[]> {
  const conflicts: PortConflict[] = [];

  for (const service of services) {
    if (await canListenOnPort(service.port)) {
      continue;
    }

    conflicts.push({
      ...service,
      listeners: await describeListeners(service.port),
    });
  }

  return conflicts;
}

function getLocalServices(): LocalService[] {
  const services = new Map<string, LocalService>();
  services.set("gateway", {
    name: "gateway",
    port: getGatewayPort(),
  });

  for (const route of routeMap) {
    const port = Number(new URL(route.localOrigin).port);
    services.set(route.name, {
      name: route.name,
      port,
    });
  }

  return [...services.values()].sort((left, right) => left.port - right.port);
}

function getGatewayPort() {
  const configuredPort = process.env.GATEWAY_PORT ?? process.env.PORT ?? "3000";
  const port = Number(configuredPort);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      `Invalid gateway port "${configuredPort}". Expected an integer between 1 and 65535.`,
    );
  }

  return port;
}

function shouldSkipCheck() {
  const value = process.env.SKIP_DEV_PORT_CHECK?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

async function canListenOnPort(port: number): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (error: NodeJS.ErrnoException) => {
      server.close();
      if (error.code === "EADDRINUSE" || error.code === "EACCES") {
        resolve(false);
        return;
      }

      reject(error);
    });

    server.listen(port, () => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(true);
      });
    });
  });
}

async function describeListeners(port: number): Promise<string[]> {
  const ssListeners = await describeListenersWithSs(port);
  if (ssListeners.length > 0) {
    return ssListeners;
  }

  return describeListenersWithLsof(port);
}

async function describeListenersWithSs(port: number): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync("ss", [
      "-ltnp",
      `( sport = :${port} )`,
    ]);

    return stdout
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(1)
      .map((line) => line.replace(/\s+/gu, " "));
  } catch (error) {
    const errno = getErrnoCode(error);
    if (errno === "ENOENT") {
      return [];
    }

    return [];
  }
}

async function describeListenersWithLsof(port: number): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync("lsof", [
      "-nP",
      `-iTCP:${port}`,
      "-sTCP:LISTEN",
    ]);

    const lines = stdout
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.slice(1).map((line) => formatLsofLine(line));
  } catch (error) {
    const errno = getErrnoCode(error);
    if (errno === "ENOENT") {
      return [];
    }

    return [];
  }
}

function formatLsofLine(line: string) {
  const columns = line.split(/\s+/u);
  const command = columns[0] ?? "unknown";
  const pid = columns[1] ?? "?";
  const user = columns[2] ?? "unknown";
  const address = columns.at(-1) ?? "";
  return `${command} pid=${pid} user=${user}${address ? ` ${address}` : ""}`;
}

function getErrnoCode(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return "";
}
