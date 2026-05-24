export type Runtime = "node" | "edge" | "cloudflare-workers" | "unknown";

export function detectRuntime(): Runtime {
  const globalRecord = globalThis as Record<string, unknown>;

  if ("WebSocketPair" in globalRecord && "caches" in globalRecord) {
    return "cloudflare-workers";
  }

  if ("EdgeRuntime" in globalRecord) {
    return "edge";
  }

  if ("process" in globalRecord) {
    return "node";
  }

  return "unknown";
}
