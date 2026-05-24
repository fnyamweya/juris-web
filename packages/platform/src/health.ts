import type {
  AppManifest,
  HealthResponse,
  VersionResponse,
} from "@repo/contracts";
import { validateAppManifest } from "@repo/contracts";
import { getEnv } from "./env";

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}

export function createLiveHealthResponse(manifest: AppManifest): Response {
  const body: HealthResponse = {
    status: "healthy",
    service: manifest.observability.serviceName,
    version: manifest.version,
    timestamp: new Date().toISOString(),
  };
  return jsonResponse(body);
}

export function createReadyHealthResponse(manifest: AppManifest): Response {
  validateAppManifest(manifest);
  const body: HealthResponse = {
    status: "healthy",
    service: manifest.observability.serviceName,
    version: manifest.version,
    timestamp: new Date().toISOString(),
    checks: {
      i18n: "ok",
      manifest: "ok",
    },
  };
  return jsonResponse(body);
}

export function createVersionResponse(manifest: AppManifest): Response {
  const body: VersionResponse = {
    name: manifest.name,
    version: manifest.version,
    gitSha: getEnv("GIT_SHA") ?? "local",
    buildTime: getEnv("BUILD_TIME") ?? new Date().toISOString(),
    runtime: manifest.runtime,
  };
  return jsonResponse(body);
}
