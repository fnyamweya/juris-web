import { getEnv } from "@repo/platform";
import packageMetadata from "../package.json";

export const appEnvironments = [
  "local",
  "preview",
  "staging",
  "production",
] as const;

export type AppEnvironment = (typeof appEnvironments)[number];

export type PlatformFeatureFlags = {
  reactScan: boolean;
};

export type PlatformPublicConfig = {
  appEnvironment: AppEnvironment;
  platformVersion: string;
  featureFlags: PlatformFeatureFlags;
};

export function isAppEnvironment(
  value: string | undefined,
): value is AppEnvironment {
  return appEnvironments.some((environment) => environment === value);
}

export function getPublicAppEnvironment(): AppEnvironment {
  const configuredValue = getEnv("NEXT_PUBLIC_APP_ENV");
  return isAppEnvironment(configuredValue) ? configuredValue : "local";
}

export function getPlatformVersion(): string {
  return getEnv("NEXT_PUBLIC_PLATFORM_VERSION") ?? packageMetadata.version;
}

export function getPlatformFeatureFlags(): PlatformFeatureFlags {
  return {
    reactScan: getEnv("NEXT_PUBLIC_ENABLE_REACT_SCAN") === "true",
  };
}

export function getPlatformPublicConfig(): PlatformPublicConfig {
  return {
    appEnvironment: getPublicAppEnvironment(),
    platformVersion: getPlatformVersion(),
    featureFlags: getPlatformFeatureFlags(),
  };
}
