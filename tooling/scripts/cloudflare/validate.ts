import { existsSync } from "node:fs";
import path from "node:path";
import { routeMap } from "../../../apps/gateway/src/route-map";
import { listDeployableApps, workspaceRoot } from "./shared";

const failures: string[] = [];
const apps = listDeployableApps();
const routeNames = new Set(routeMap.map((route) => route.name));
const deployableNames = new Set(apps.map((app) => app.slug));
const workerNames = new Set<string>();

for (const app of apps) {
  const openNextConfigPath = path.join(app.directory, "open-next.config.ts");
  if (app.kind === "opennext" && !existsSync(openNextConfigPath)) {
    failures.push(`${app.slug} is missing open-next.config.ts`);
  }

  if (app.kind !== "gateway" && !routeNames.has(app.slug)) {
    failures.push(
      `${app.slug} is deployable but missing from gateway route-map.ts`,
    );
  }

  if (workerNames.has(app.baseWorkerName)) {
    failures.push(
      `Duplicate Cloudflare worker base name ${app.baseWorkerName}`,
    );
  }
  workerNames.add(app.baseWorkerName);
}

for (const route of routeMap) {
  if (!deployableNames.has(route.name)) {
    failures.push(
      `Gateway route "${route.name}" does not map to a deployable Cloudflare app`,
    );
  }
}

if (!existsSync(path.join(workspaceRoot, "apps", "docs", "wrangler.jsonc"))) {
  failures.push("apps/docs is missing wrangler.jsonc");
}

if (!deployableNames.has("gateway")) {
  failures.push("apps/gateway must remain deployable");
}

if (failures.length > 0) {
  throw new Error(
    `Cloudflare deployment validation failed:\n- ${failures.join("\n- ")}`,
  );
}

console.info(`Cloudflare deployment validation passed for ${apps.length} apps`);
