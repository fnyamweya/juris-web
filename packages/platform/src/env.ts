type ProcessLike = {
  env?: Record<string, string | undefined>;
};

export function getEnv(name: string): string | undefined {
  const globalRecord = globalThis as { process?: ProcessLike };
  return globalRecord.process?.env?.[name];
}

export function requireEnv(name: string): string {
  const value = getEnv(name);

  if (!value) {
    throw new Error("Missing required environment variable: " + name);
  }

  return value;
}
