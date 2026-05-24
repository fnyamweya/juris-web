import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();

function write(path, content) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content.trimStart());
}

const packageVersion = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
).version;
const locales = ["en", "sw", "fr"];
const appConfigs = [
  {
    name: "public",
    displayName: "Public",
    port: 3001,
    basePath: "/",
    owner: "growth-platform",
    criticality: "tier-2",
    permission: "console:read",
    serviceName: "web-public",
    productPath: "",
    routes: ["about", "pricing", "security"],
  },
  {
    name: "identity",
    displayName: "Identity",
    port: 3002,
    basePath: "/login",
    owner: "identity-platform",
    criticality: "tier-1",
    permission: "console:read",
    serviceName: "web-identity",
    productPath: "",
    routes: ["login", "register", "forgot-password", "logout"],
  },
  {
    name: "console",
    displayName: "Console",
    port: 3003,
    basePath: "/console",
    owner: "customer-platform",
    criticality: "tier-1",
    permission: "console:read",
    serviceName: "web-console",
    productPath: "console",
    routes: ["overview", "activity", "tenants"],
  },
  {
    name: "admin",
    displayName: "Admin",
    port: 3004,
    basePath: "/admin",
    owner: "operations-platform",
    criticality: "tier-1",
    permission: "admin:read",
    serviceName: "web-admin",
    productPath: "admin",
    routes: ["users", "tenants", "audit"],
  },
  {
    name: "billing",
    displayName: "Billing",
    port: 3005,
    basePath: "/billing",
    owner: "revenue-platform",
    criticality: "tier-1",
    permission: "billing:read",
    serviceName: "web-billing",
    productPath: "billing",
    routes: ["invoices", "plans", "payment-methods"],
  },
  {
    name: "reporting",
    displayName: "Reporting",
    port: 3006,
    basePath: "/reports",
    owner: "insights-platform",
    criticality: "tier-2",
    permission: "reporting:read",
    serviceName: "web-reporting",
    productPath: "reports",
    routes: ["usage", "performance", "exports"],
  },
  {
    name: "settings",
    displayName: "Settings",
    port: 3007,
    basePath: "/settings",
    owner: "workspace-platform",
    criticality: "tier-2",
    permission: "settings:read",
    serviceName: "web-settings",
    productPath: "settings",
    routes: ["profile", "organization", "security", "preferences"],
  },
  {
    name: "support",
    displayName: "Support",
    port: 3008,
    basePath: "/support",
    owner: "service-platform",
    criticality: "tier-2",
    permission: "support:read",
    serviceName: "web-support",
    productPath: "support",
    routes: ["tickets", "knowledge-base", "contact"],
  },
];

const repoPackages = [
  "@repo/ui",
  "@repo/tokens",
  "@repo/auth",
  "@repo/access-control",
  "@repo/i18n",
  "@repo/telemetry",
  "@repo/contracts",
  "@repo/security",
  "@repo/platform",
  "@repo/testing",
];

function commonAppDeps() {
  return {
    "@next/bundle-analyzer": "15.5.18",
    "@opennextjs/cloudflare": "1.19.11",
    "@repo/access-control": "workspace:*",
    "@repo/auth": "workspace:*",
    "@repo/contracts": "workspace:*",
    "@repo/i18n": "workspace:*",
    "@repo/platform": "workspace:*",
    "@repo/security": "workspace:*",
    "@repo/telemetry": "workspace:*",
    "@repo/ui": "workspace:*",
    "@repo/tokens": "workspace:*",
    "lucide-react": "^0.468.0",
    next: "15.5.18",
    "next-intl": "4.12.0",
    "next-themes": "^0.4.6",
    react: "19.2.6",
    "react-dom": "19.2.6",
    zod: "^4.1.13",
  };
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function packageJson(name, fields) {
  write(`${name}/package.json`, json(fields));
}

write(
  "package.json",
  json({
    name: "juris",
    version: packageVersion,
    private: true,
    type: "module",
    packageManager: "pnpm@11.2.2",
    engines: {
      node: ">=20.18.0",
    },
    scripts: {
      dev: "turbo run dev --parallel --continue",
      "dev:gateway": "pnpm --filter @juris/gateway dev",
      "dev:public": "pnpm --filter @juris/public dev",
      "dev:identity": "pnpm --filter @juris/identity dev",
      "dev:console": "pnpm --filter @juris/console dev",
      "dev:admin": "pnpm --filter @juris/admin dev",
      "dev:billing": "pnpm --filter @juris/billing dev",
      "dev:reporting": "pnpm --filter @juris/reporting dev",
      "dev:settings": "pnpm --filter @juris/settings dev",
      "dev:support": "pnpm --filter @juris/support dev",
      build: "turbo run build --concurrency=2",
      lint: "turbo run lint --concurrency=4",
      typecheck: "turbo run typecheck --concurrency=4",
      test: "turbo run test --concurrency=4",
      "test:watch": "turbo run test:watch --parallel",
      "test:coverage": "turbo run test:coverage --concurrency=4",
      "test:e2e": "playwright test",
      storybook: "pnpm --filter @repo/ui storybook",
      "storybook:build": "pnpm --filter @repo/ui storybook:build",
      format: "prettier --write .",
      "format:check": "prettier --check .",
      knip: "knip",
      analyze: "ANALYZE=true turbo run build --concurrency=2",
      "validate:manifests": "tsx tooling/scripts/validate-manifests.ts",
      "validate:architecture": "tsx tooling/scripts/validate-architecture.ts",
      "validate:i18n": "tsx tooling/scripts/validate-i18n.ts",
      validate:
        "pnpm typecheck && pnpm lint && pnpm format:check && pnpm validate:architecture && pnpm validate:manifests && pnpm validate:i18n && pnpm test && pnpm build",
      clean:
        "turbo run clean --concurrency=8 && rm -rf .turbo coverage playwright-report test-results",
    },
    devDependencies: {
      "@eslint/js": "10.4.0",
      "@next/bundle-analyzer": "15.5.18",
      "@next/eslint-plugin-next": "15.5.18",
      "@opennextjs/cloudflare": "1.19.11",
      "@playwright/test": "^1.57.0",
      "@storybook/addon-docs": "10.4.1",
      "@storybook/react-vite": "10.4.1",
      "@testing-library/jest-dom": "^6.9.1",
      "@testing-library/react": "^16.3.0",
      "@testing-library/user-event": "^14.6.1",
      "@types/node": "^24.10.1",
      "@types/react": "^19.2.7",
      "@types/react-dom": "^19.2.3",
      "@vitest/coverage-v8": "4.1.7",
      autoprefixer: "^10.4.22",
      eslint: "10.4.0",
      "eslint-plugin-import": "^2.32.0",
      "eslint-plugin-react": "^7.37.5",
      "eslint-plugin-react-hooks": "^7.0.1",
      jsdom: "^27.3.0",
      knip: "^5.71.0",
      playwright: "^1.57.0",
      postcss: "^8.5.6",
      prettier: "^3.7.4",
      "prettier-plugin-tailwindcss": "^0.7.1",
      storybook: "10.4.1",
      tailwindcss: "^3.4.18",
      turbo: "2.9.14",
      tsx: "^4.21.0",
      typescript: "5.8.3",
      "typescript-eslint": "8.49.0",
      vite: "^7.2.7",
      vitest: "4.1.7",
      wrangler: "^4.57.1",
    },
  }),
);

write(
  "pnpm-workspace.yaml",
  `
packages:
  - "apps/*"
  - "packages/*"
`,
);

write(
  "turbo.json",
  json({
    $schema: "https://turbo.build/schema.json",
    tasks: {
      build: {
        dependsOn: ["^build"],
        outputs: [".next/**", "!.next/cache/**", "dist/**", ".open-next/**"],
      },
      dev: {
        cache: false,
        persistent: true,
      },
      lint: {
        dependsOn: ["^build"],
        outputs: [],
      },
      typecheck: {
        dependsOn: ["^build"],
        outputs: [],
      },
      test: {
        dependsOn: ["^build"],
        outputs: ["coverage/**"],
      },
      "test:coverage": {
        dependsOn: ["^build"],
        outputs: ["coverage/**"],
      },
      "storybook:build": {
        dependsOn: ["^build"],
        outputs: ["storybook-static/**"],
      },
      validate: {
        dependsOn: ["typecheck", "lint", "test", "build"],
        outputs: [],
      },
      clean: {
        cache: false,
      },
    },
  }),
);

write(
  ".prettierrc.json",
  json({
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    plugins: ["prettier-plugin-tailwindcss"],
  }),
);

write(
  ".prettierignore",
  `
node_modules
.next
.open-next
dist
coverage
playwright-report
test-results
storybook-static
pnpm-lock.yaml
`,
);

write(
  ".gitignore",
  `
node_modules
.next
.open-next
dist
coverage
playwright-report
test-results
storybook-static
.turbo
.env
.wrangler
`,
);

write(
  ".npmrc",
  `
strict-peer-dependencies=false
auto-install-peers=true
`,
);

write(
  ".env.example",
  `
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=local
NEXT_PUBLIC_PLATFORM_VERSION=${packageVersion}
OTEL_EXPORTER_OTLP_ENDPOINT=
NEXT_PUBLIC_ENABLE_REACT_SCAN=false
`,
);

write(
  "postcss.config.mjs",
  `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
`,
);

write(
  "knip.json",
  json({
    workspaces: {
      ".": {
        entry: [
          "tooling/scripts/*.ts",
          "playwright.config.ts",
          "packages/ui/.storybook/*.ts",
        ],
        project: ["**/*.{ts,tsx,js,mjs}"],
      },
      "apps/*": {
        entry: ["app/**/*.{ts,tsx}", "src/**/*.{ts,tsx}", "next.config.ts"],
        project: ["**/*.{ts,tsx}"],
      },
      "packages/*": {
        entry: ["src/index.ts", "src/**/*.test.{ts,tsx}"],
        project: ["src/**/*.{ts,tsx}"],
      },
    },
    ignoreDependencies: [
      "@types/node",
      "@types/react",
      "@types/react-dom",
      "autoprefixer",
      "playwright",
      "wrangler",
    ],
    ignore: ["**/.next/**", "**/.open-next/**", "**/dist/**"],
  }),
);

write(
  "playwright.config.ts",
  `
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000/api/health/live",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
`,
);

write(
  "tests/e2e/platform.spec.ts",
  `
import { expect, test } from "@playwright/test";

test("public home page loads", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: /juris/i })).toBeVisible();
});

test("login page loads and mock sign in navigates to console", async ({ page }) => {
  await page.goto("/en/login");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  await page.getByRole("button", { name: /continue with mock/i }).click();
  await expect(page).toHaveURL(/\\/en\\/console/);
  await expect(page.getByRole("heading", { name: /customer console/i })).toBeVisible();
});

test("product pages load through the gateway", async ({ page }) => {
  for (const path of ["/en/billing", "/en/reports", "/en/admin", "/en/settings", "/en/support"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
  }
});

test("theme toggle and locale route work", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: /toggle theme/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("link", { name: "Français" }).click();
  await expect(page).toHaveURL(/\\/fr/);
});
`,
);

write(
  "tsconfig.json",
  `
{
  "extends": "./packages/typescript-config/base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["tooling/**/*.ts", "tests/**/*.ts", "playwright.config.ts"],
  "exclude": ["node_modules", ".next", ".open-next", "dist"]
}
`,
);

packageJson("packages/typescript-config", {
  name: "@repo/typescript-config",
  version: packageVersion,
  private: true,
  type: "module",
  files: ["base.json", "nextjs.json", "react-library.json"],
  exports: {
    "./base": "./base.json",
    "./nextjs": "./nextjs.json",
    "./react-library": "./react-library.json",
  },
});

write(
  "packages/typescript-config/base.json",
  `
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "types": ["node"]
  }
}
`,
);

write(
  "packages/typescript-config/nextjs.json",
  `
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "allowJs": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`,
);

write(
  "packages/typescript-config/react-library.json",
  `
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  },
  "include": ["src", ".storybook"],
  "exclude": ["node_modules", "dist"]
}
`,
);

packageJson("packages/eslint-config", {
  name: "@repo/eslint-config",
  version: packageVersion,
  private: true,
  type: "module",
  exports: {
    ".": "./index.js",
    "./library": "./library.js",
    "./next": "./next.js",
  },
  dependencies: {
    "@eslint/js": "10.4.0",
    "@next/eslint-plugin-next": "15.5.18",
    "eslint-plugin-import": "^2.32.0",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^7.0.1",
    "typescript-eslint": "8.49.0",
  },
});

write(
  "packages/eslint-config/index.js",
  `
import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import importPlugin from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const ignores = {
  ignores: [
    "node_modules/**",
    ".next/**",
    ".open-next/**",
    "dist/**",
    "coverage/**",
    "storybook-static/**",
    "playwright-report/**",
    "test-results/**",
    "*.config.mjs",
    "next-env.d.ts"
  ]
};

const typedRules = {
  "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": [
    "error",
    { checksVoidReturn: { attributes: false } }
  ],
  "@typescript-eslint/no-unnecessary-type-assertion": "error",
  "@typescript-eslint/require-await": "error",
  "no-console": ["error", { allow: ["info", "warn", "error"] }],
  "no-restricted-syntax": [
    "error",
    {
      selector: "MemberExpression[object.object.name='process'][object.property.name='env']",
      message:
        "Use @repo/platform environment helpers outside config and platform files."
    }
  ]
};

export const baseConfig = tseslint.config(
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd()
      }
    },
    plugins: {
      import: importPlugin,
      react: reactPlugin,
      "react-hooks": hooksPlugin
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      ...typedRules,
      "react/jsx-key": "error",
      "react/jsx-no-useless-fragment": "error",
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "import/no-duplicates": "error",
      "prefer-const": "error"
    }
  },
  {
    files: [
      "**/next.config.ts",
      "**/open-next.config.ts",
      "**/packages/platform/**",
      "**/tooling/**",
      "**/playwright.config.ts"
    ],
    rules: {
      "no-restricted-syntax": "off",
      "@typescript-eslint/require-await": "off"
    }
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.stories.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/require-await": "off"
    }
  }
);

const nextRecommended = nextPlugin.configs.recommended?.rules ?? {};
const nextVitals = nextPlugin.configs["core-web-vitals"]?.rules ?? {};

export const nextConfig = [
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin
    },
    rules: {
      ...nextRecommended,
      ...nextVitals
    }
  }
];

export default baseConfig;
`,
);

write(
  "packages/eslint-config/library.js",
  `
import { baseConfig } from "./index.js";

export default baseConfig;
`,
);

write(
  "packages/eslint-config/next.js",
  `
import { nextConfig } from "./index.js";

export default nextConfig;
`,
);

function basePackageScripts(hasTests = true) {
  return {
    build: "tsc --noEmit",
    lint: "eslint .",
    typecheck: "tsc --noEmit",
    test: hasTests ? "vitest run" : "vitest run --passWithNoTests",
    "test:watch": "vitest --passWithNoTests",
    "test:coverage": "vitest run --coverage --passWithNoTests",
    clean: "rm -rf dist coverage",
  };
}

function writePackageBase(path, fields, tsconfig = "react-library") {
  packageJson(path, fields);
  write(
    `${path}/tsconfig.json`,
    `
{
  "extends": "@repo/typescript-config/${tsconfig}",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src", "vitest.config.ts", "vitest.setup.ts"],
  "exclude": ["node_modules", "dist"]
}
`,
  );
  write(
    `${path}/eslint.config.mjs`,
    `
import config from "@repo/eslint-config/library";

export default config;
`,
  );
  write(
    `${path}/vitest.config.ts`,
    `
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true
  }
});
`,
  );
  write(
    `${path}/vitest.setup.ts`,
    `import "@testing-library/jest-dom/vitest";\n`,
  );
}

writePackageBase("packages/contracts", {
  name: "@repo/contracts",
  version: packageVersion,
  private: true,
  type: "module",
  exports: {
    ".": "./src/index.ts",
    "./app-manifest": "./src/app-manifest.ts",
    "./health": "./src/health.ts",
    "./api": "./src/api.ts",
    "./audit": "./src/audit.ts",
    "./navigation": "./src/navigation.ts",
  },
  scripts: basePackageScripts(true),
  dependencies: {
    zod: "^4.1.13",
  },
  devDependencies: {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
  },
});

write(
  "packages/contracts/src/app-manifest.ts",
  `
import { z } from "zod";

export enum Locale {
  En = "en",
  Sw = "sw",
  Fr = "fr"
}

export enum AppCriticality {
  Tier0 = "tier-0",
  Tier1 = "tier-1",
  Tier2 = "tier-2",
  Tier3 = "tier-3"
}

export enum AppRuntime {
  CloudflareWorkers = "cloudflare-workers",
  Edge = "edge",
  Node = "node"
}

export const LocaleSchema = z.nativeEnum(Locale);
export const AppCriticalitySchema = z.nativeEnum(AppCriticality);
export const AppRuntimeSchema = z.nativeEnum(AppRuntime);

export const AppManifestSchema = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9-]*$/),
  displayName: z.string().min(1),
  basePath: z.string().min(1).regex(/^\\/[a-z0-9-]*$/),
  owner: z.string().min(1),
  version: z.string().min(1),
  criticality: AppCriticalitySchema,
  runtime: AppRuntimeSchema,
  requiredPlatformVersion: z.string().min(1),
  permissions: z.array(z.string().min(1)),
  locales: z.array(LocaleSchema).min(1),
  health: z.object({
    live: z.string().min(1),
    ready: z.string().min(1),
    version: z.string().min(1)
  }),
  observability: z.object({
    serviceName: z.string().min(1)
  })
});

export type AppManifest = z.infer<typeof AppManifestSchema>;

export function validateAppManifest(manifest: unknown): AppManifest {
  return AppManifestSchema.parse(manifest);
}
`,
);

write(
  "packages/contracts/src/health.ts",
  `
import { z } from "zod";

export const HealthStatusSchema = z.enum(["healthy", "degraded", "unavailable"]);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const HealthResponseSchema = z.object({
  status: HealthStatusSchema,
  service: z.string().min(1),
  version: z.string().min(1),
  timestamp: z.string().datetime(),
  checks: z.record(z.string(), z.unknown()).optional()
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const VersionResponseSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  gitSha: z.string().min(1),
  buildTime: z.string().min(1),
  runtime: z.string().min(1)
});

export type VersionResponse = z.infer<typeof VersionResponseSchema>;
`,
);

write(
  "packages/contracts/src/api.ts",
  `
import { z } from "zod";

export const ApiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.unknown().optional()
});

export const ApiMetaSchema = z.object({
  requestId: z.string().optional(),
  traceId: z.string().optional()
});

export const ApiEnvelopeSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: ApiErrorSchema.optional(),
  meta: ApiMetaSchema.optional()
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ApiMeta = z.infer<typeof ApiMetaSchema>;
export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
};

export function createSuccessEnvelope<T>(data: T, meta?: ApiMeta): ApiEnvelope<T> {
  return {
    success: true,
    data,
    meta
  };
}

export function createErrorEnvelope(error: ApiError, meta?: ApiMeta): ApiEnvelope<never> {
  return {
    success: false,
    error,
    meta
  };
}
`,
);

write(
  "packages/contracts/src/audit.ts",
  `
import { z } from "zod";

export const AuditEventSchema = z.object({
  id: z.string().min(1),
  actor: z.string().min(1),
  action: z.string().min(1),
  target: z.string().min(1),
  severity: z.enum(["info", "warning", "danger"]),
  occurredAt: z.string().datetime(),
  tenantId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
`,
);

write(
  "packages/contracts/src/navigation.ts",
  `
export type NavItem = {
  label: string;
  href: string;
  permission?: string;
  external?: boolean;
};
`,
);

write(
  "packages/contracts/src/index.ts",
  `
export * from "./api";
export * from "./app-manifest";
export * from "./audit";
export * from "./health";
export * from "./navigation";
`,
);

write(
  "packages/contracts/src/app-manifest.test.ts",
  `
import { describe, expect, it } from "vitest";
import { AppCriticality, AppRuntime, Locale, validateAppManifest } from "./app-manifest";

describe("validateAppManifest", () => {
  it("validates a deployable app manifest", () => {
    expect(
      validateAppManifest({
        name: "billing",
        displayName: "Billing",
        basePath: "/billing",
        owner: "revenue-platform",
        version: "0.1.0",
        criticality: AppCriticality.Tier1,
        runtime: AppRuntime.CloudflareWorkers,
        requiredPlatformVersion: "^0.1.0",
        permissions: ["billing:read"],
        locales: [Locale.En, Locale.Sw, Locale.Fr],
        health: {
          live: "/api/health/live",
          ready: "/api/health/ready",
          version: "/api/health/version"
        },
        observability: {
          serviceName: "web-billing"
        }
      }).name
    ).toBe("billing");
  });
});
`,
);

write(
  "packages/contracts/src/health.test.ts",
  `
import { describe, expect, it } from "vitest";
import { HealthResponseSchema } from "./health";

describe("HealthResponseSchema", () => {
  it("accepts a healthy response", () => {
    expect(
      HealthResponseSchema.parse({
        status: "healthy",
        service: "web-console",
        version: "0.1.0",
        timestamp: new Date().toISOString()
      }).status
    ).toBe("healthy");
  });
});
`,
);

writePackageBase("packages/i18n", {
  name: "@repo/i18n",
  version: packageVersion,
  private: true,
  type: "module",
  exports: {
    ".": "./src/index.ts",
    "./messages/en.json": "./messages/en.json",
    "./messages/sw.json": "./messages/sw.json",
    "./messages/fr.json": "./messages/fr.json",
  },
  scripts: basePackageScripts(true),
  dependencies: {
    "next-intl": "4.12.0",
  },
  devDependencies: {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
  },
});

const messages = {
  en: {
    common: {
      appName: "Juris",
      loading: "Loading",
      error: "Something went wrong",
      retry: "Retry",
      save: "Save",
      cancel: "Cancel",
      search: "Search",
      settings: "Settings",
      logout: "Log out",
      theme: "Theme",
      language: "Language",
    },
    nav: {
      home: "Home",
      console: "Console",
      admin: "Admin",
      billing: "Billing",
      reporting: "Reporting",
      settings: "Settings",
      support: "Support",
    },
    auth: {
      login: "Sign in",
      logout: "Signed out",
      email: "Email",
      password: "Password",
      forgotPassword: "Forgot password",
      signIn: "Sign in",
    },
    status: {
      healthy: "Healthy",
      degraded: "Degraded",
      unavailable: "Unavailable",
    },
  },
  sw: {
    common: {
      appName: "Juris",
      loading: "Inapakia",
      error: "Hitilafu imetokea",
      retry: "Jaribu tena",
      save: "Hifadhi",
      cancel: "Ghairi",
      search: "Tafuta",
      settings: "Mipangilio",
      logout: "Toka",
      theme: "Mandhari",
      language: "Lugha",
    },
    nav: {
      home: "Nyumbani",
      console: "Dashibodi",
      admin: "Usimamizi",
      billing: "Malipo",
      reporting: "Ripoti",
      settings: "Mipangilio",
      support: "Usaidizi",
    },
    auth: {
      login: "Ingia",
      logout: "Umetoka",
      email: "Barua pepe",
      password: "Nenosiri",
      forgotPassword: "Umesahau nenosiri",
      signIn: "Ingia",
    },
    status: {
      healthy: "Nzima",
      degraded: "Imepungua",
      unavailable: "Haipatikani",
    },
  },
  fr: {
    common: {
      appName: "Juris",
      loading: "Chargement",
      error: "Une erreur est survenue",
      retry: "Réessayer",
      save: "Enregistrer",
      cancel: "Annuler",
      search: "Rechercher",
      settings: "Paramètres",
      logout: "Se déconnecter",
      theme: "Thème",
      language: "Langue",
    },
    nav: {
      home: "Accueil",
      console: "Console",
      admin: "Admin",
      billing: "Facturation",
      reporting: "Rapports",
      settings: "Paramètres",
      support: "Support",
    },
    auth: {
      login: "Se connecter",
      logout: "Déconnecté",
      email: "E-mail",
      password: "Mot de passe",
      forgotPassword: "Mot de passe oublié",
      signIn: "Se connecter",
    },
    status: {
      healthy: "Opérationnel",
      degraded: "Dégradé",
      unavailable: "Indisponible",
    },
  },
};

for (const locale of locales) {
  write(`packages/i18n/messages/${locale}.json`, json(messages[locale]));
}

write(
  "packages/i18n/src/locales.ts",
  `
export const locales = ["en", "sw", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function assertLocale(value: string | undefined): asserts value is Locale {
  if (!isLocale(value)) {
    throw new Error("Unsupported locale");
  }
}

export function getDirection(_locale: Locale): "ltr" {
  return "ltr";
}
`,
);

write(
  "packages/i18n/src/routing.ts",
  `
import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "./locales";

export const routing = defineRouting({
  locales,
  defaultLocale
});
`,
);

write(
  "packages/i18n/src/messages.ts",
  `
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import sw from "../messages/sw.json";
import type { Locale } from "./locales";

export type Messages = typeof en;

export const messagesByLocale: Record<Locale, Messages> = {
  en,
  sw,
  fr
};

export async function getMessages(locale: Locale): Promise<Messages> {
  return messagesByLocale[locale];
}
`,
);

write(
  "packages/i18n/src/format.ts",
  `
import type { Locale } from "./locales";

export function formatDate(value: Date | string | number, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatCurrency(value: number, locale: Locale, currency = "USD"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1
  }).format(value);
}
`,
);

write(
  "packages/i18n/src/index.ts",
  `
export * from "./format";
export * from "./locales";
export * from "./messages";
export * from "./routing";
`,
);

write(
  "packages/i18n/src/format.test.ts",
  `
import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "./format";

describe("format helpers", () => {
  it("formats locale aware values", () => {
    expect(formatCurrency(1200, "en")).toContain("$");
    expect(formatNumber(1200, "fr")).toContain("1");
    expect(formatPercent(0.124, "en")).toBe("12.4%");
    expect(formatDate("2026-05-23T10:00:00.000Z", "en")).toContain("2026");
  });
});
`,
);

writePackageBase("packages/tokens", {
  name: "@repo/tokens",
  version: packageVersion,
  private: true,
  type: "module",
  exports: {
    ".": "./src/index.ts",
    "./theme.css": "./src/theme.css",
    "./tailwind-preset": "./src/tailwind-preset.ts",
  },
  scripts: basePackageScripts(false),
  dependencies: {
    tailwindcss: "^3.4.18",
  },
  devDependencies: {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
  },
});

write(
  "packages/tokens/src/index.ts",
  `
export const colors = {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  danger: "hsl(var(--danger))",
  info: "hsl(var(--info))",
  muted: "hsl(var(--muted))",
  accent: "hsl(var(--accent))"
} as const;

export const radius = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem"
} as const;

export const spacing = {
  page: "1.5rem",
  section: "2rem"
} as const;

export const typography = {
  fontSans: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontMono: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
} as const;

export const shadows = {
  soft: "0 1px 2px hsl(var(--foreground) / 0.06)",
  raised: "0 12px 32px hsl(var(--foreground) / 0.12)"
} as const;

export const zIndex = {
  dropdown: 20,
  sticky: 30,
  overlay: 40,
  modal: 50
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px"
} as const;
`,
);

write(
  "packages/tokens/src/theme.css",
  `
:root {
  --background: 0 0% 100%;
  --foreground: 224 18% 12%;
  --card: 0 0% 100%;
  --card-foreground: 224 18% 12%;
  --popover: 0 0% 100%;
  --popover-foreground: 224 18% 12%;
  --primary: 204 84% 32%;
  --primary-foreground: 0 0% 100%;
  --secondary: 168 43% 36%;
  --secondary-foreground: 0 0% 100%;
  --muted: 220 14% 96%;
  --muted-foreground: 220 9% 42%;
  --accent: 32 82% 48%;
  --accent-foreground: 224 18% 12%;
  --destructive: 0 72% 45%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 13% 88%;
  --input: 220 13% 88%;
  --ring: 204 84% 32%;
  --success: 145 58% 34%;
  --warning: 38 90% 48%;
  --danger: 0 72% 45%;
  --info: 204 84% 32%;
  --radius: 0.5rem;
}

.dark {
  --background: 220 18% 9%;
  --foreground: 210 18% 96%;
  --card: 220 16% 12%;
  --card-foreground: 210 18% 96%;
  --popover: 220 16% 12%;
  --popover-foreground: 210 18% 96%;
  --primary: 200 82% 58%;
  --primary-foreground: 220 18% 9%;
  --secondary: 164 46% 46%;
  --secondary-foreground: 220 18% 9%;
  --muted: 220 14% 18%;
  --muted-foreground: 220 10% 70%;
  --accent: 35 88% 58%;
  --accent-foreground: 220 18% 9%;
  --destructive: 0 70% 56%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 13% 24%;
  --input: 220 13% 24%;
  --ring: 200 82% 58%;
  --success: 145 55% 45%;
  --warning: 38 90% 58%;
  --danger: 0 70% 56%;
  --info: 200 82% 58%;
}
`,
);

write(
  "packages/tokens/src/tailwind-preset.ts",
  `
import type { Config } from "tailwindcss";

export const tailwindPreset = {
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        info: "hsl(var(--info))"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      boxShadow: {
        soft: "0 1px 2px hsl(var(--foreground) / 0.06)",
        raised: "0 12px 32px hsl(var(--foreground) / 0.12)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      }
    }
  }
} satisfies Partial<Config>;
`,
);

writePackageBase("packages/auth", {
  name: "@repo/auth",
  version: packageVersion,
  private: true,
  type: "module",
  exports: {
    ".": "./src/index.ts",
  },
  scripts: basePackageScripts(false),
  devDependencies: {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
  },
});

write(
  "packages/auth/src/types.ts",
  `
export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
};

export type Session = {
  status: "anonymous" | "authenticated";
  user?: User;
  currentTenant?: Tenant;
  availableTenants: Tenant[];
  roles: string[];
  permissions: string[];
  expiresAt?: string;
};

export type AuthenticatedSession = Session & {
  status: "authenticated";
  user: User;
  currentTenant: Tenant;
};

export type EnterpriseIdentityProvider = {
  id: string;
  name: string;
  kind: "oidc" | "saml";
  signInUrl: string;
};

export type AuthProviderContract = {
  getSession(): Promise<Session>;
  refreshSession(): Promise<Session>;
  logout(): Promise<void>;
  stepUp(reason: string): Promise<void>;
};
`,
);

write(
  "packages/auth/src/mock-session.ts",
  `
import type { AuthenticatedSession, Tenant, User } from "./types";

export const mockUser: User = {
  id: "user_123",
  name: "Amara Okafor",
  email: "amara.okafor@example.com",
  avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Amara%20Okafor"
};

export const mockTenants: Tenant[] = [
  { id: "tenant_alpha", name: "Acme Legal Group", slug: "acme-legal" },
  { id: "tenant_nova", name: "Nova Compliance", slug: "nova-compliance" },
  { id: "tenant_kili", name: "Kilimani Chambers", slug: "kilimani-chambers" }
];

export const mockSession: AuthenticatedSession = {
  status: "authenticated",
  user: mockUser,
  currentTenant: mockTenants[0],
  availableTenants: mockTenants,
  roles: ["admin", "billing-manager", "support-lead"],
  permissions: [
    "console:read",
    "admin:read",
    "billing:read",
    "billing:write",
    "reporting:read",
    "settings:read",
    "settings:write",
    "support:read"
  ],
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
};
`,
);

write(
  "packages/auth/src/session.ts",
  `
import { mockSession } from "./mock-session";
import type { AuthenticatedSession, EnterpriseIdentityProvider, Session } from "./types";

export async function getMockSession(): Promise<AuthenticatedSession> {
  return mockSession;
}

export async function getSession(): Promise<Session> {
  return mockSession;
}

export const enterpriseIdentityProviders: EnterpriseIdentityProvider[] = [
  {
    id: "oidc-placeholder",
    name: "Enterprise OIDC",
    kind: "oidc",
    signInUrl: "/en/login?provider=oidc"
  },
  {
    id: "saml-placeholder",
    name: "Enterprise SAML",
    kind: "saml",
    signInUrl: "/en/login?provider=saml"
  }
];

export type AuthRoadmap = {
  oidcProvider: "planned";
  samlProvider: "planned";
  sessionRefresh: "planned";
  logout: "planned";
  stepUpAuthentication: "planned";
};
`,
);

write(
  "packages/auth/src/index.ts",
  `
export * from "./mock-session";
export * from "./session";
export * from "./types";
`,
);

writePackageBase("packages/access-control", {
  name: "@repo/access-control",
  version: packageVersion,
  private: true,
  type: "module",
  exports: {
    ".": "./src/index.ts",
  },
  scripts: basePackageScripts(true),
  dependencies: {
    "@repo/auth": "workspace:*",
    "@repo/contracts": "workspace:*",
  },
  devDependencies: {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
  },
});

write(
  "packages/access-control/src/index.ts",
  `
import type { Session } from "@repo/auth";
import type { AppManifest } from "@repo/contracts";

export const permissions = [
  "console:read",
  "admin:read",
  "admin:write",
  "billing:read",
  "billing:write",
  "reporting:read",
  "settings:read",
  "settings:write",
  "support:read"
] as const;

export type Permission = (typeof permissions)[number];

export function hasPermission(session: Session | undefined, permission: string): boolean {
  return Boolean(session?.permissions.includes(permission));
}

export function hasAnyPermission(
  session: Session | undefined,
  requestedPermissions: readonly string[]
): boolean {
  return requestedPermissions.some((permission) => hasPermission(session, permission));
}

export function hasAllPermissions(
  session: Session | undefined,
  requestedPermissions: readonly string[]
): boolean {
  return requestedPermissions.every((permission) => hasPermission(session, permission));
}

export function canAccessApp(session: Session | undefined, appManifest: AppManifest): boolean {
  if (appManifest.permissions.length === 0) {
    return true;
  }

  return hasAnyPermission(session, appManifest.permissions);
}
`,
);

write(
  "packages/access-control/src/access-control.test.ts",
  `
import { mockSession } from "@repo/auth";
import { describe, expect, it } from "vitest";
import { hasAllPermissions, hasAnyPermission, hasPermission } from "./index";

describe("access control", () => {
  it("checks single and grouped permissions", () => {
    expect(hasPermission(mockSession, "billing:read")).toBe(true);
    expect(hasPermission(mockSession, "admin:write")).toBe(false);
    expect(hasAnyPermission(mockSession, ["admin:write", "support:read"])).toBe(true);
    expect(hasAllPermissions(mockSession, ["console:read", "settings:read"])).toBe(true);
  });
});
`,
);

writePackageBase("packages/security", {
  name: "@repo/security",
  version: packageVersion,
  private: true,
  type: "module",
  exports: {
    ".": "./src/index.ts",
  },
  scripts: basePackageScripts(true),
  devDependencies: {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
  },
});

write(
  "packages/security/src/index.ts",
  `
export type SecurityEnvironment = "local" | "development" | "preview" | "production" | string;

export type SecurityHeadersOptions = {
  environment?: SecurityEnvironment;
  nonce?: string;
  appName?: string;
};

const baseTrustedOrigins = [
  "https://juris.example.com",
  "https://*.juris.example.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
  "http://localhost:3006",
  "http://localhost:3007",
  "http://localhost:3008"
] as const;

export function createNonce(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getTrustedOrigins(): readonly string[] {
  return baseTrustedOrigins;
}

export function isTrustedOrigin(origin: string): boolean {
  return getTrustedOrigins().some((trustedOrigin) => {
    if (trustedOrigin.includes("*")) {
      const suffix = trustedOrigin.replace("https://*", "");
      return origin.endsWith(suffix);
    }

    return origin === trustedOrigin;
  });
}

export function getContentSecurityPolicy(options: SecurityHeadersOptions = {}): string {
  const environment = options.environment ?? "production";
  const isLocal = environment === "local" || environment === "development";
  const nonceSource = options.nonce ? "'nonce-" + options.nonce + "'" : "'self'";
  const scriptSources = ["'self'", nonceSource];
  const connectSources = ["'self'", "https://*.juris.example.com"];
  const imageSources = ["'self'", "data:", "https:"];
  const styleSources = ["'self'", "'unsafe-inline'"];

  if (isLocal) {
    scriptSources.push("'unsafe-eval'");
    connectSources.push("http://localhost:*", "ws://localhost:*");
    imageSources.push("http://localhost:*");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "img-src " + imageSources.join(" "),
    "script-src " + scriptSources.join(" "),
    "style-src " + styleSources.join(" "),
    "font-src 'self' data:",
    "connect-src " + connectSources.join(" "),
    "worker-src 'self' blob:",
    "upgrade-insecure-requests"
  ].join("; ");
}

export function getSecurityHeaders(
  options: SecurityHeadersOptions = {}
): Record<string, string> {
  const environment = options.environment ?? "production";
  const headers: Record<string, string> = {
    "Content-Security-Policy": getContentSecurityPolicy(options),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin"
  };

  if (environment === "production") {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }

  return headers;
}

export function createCsrfPlaceholder(): { headerName: string; cookieName: string } {
  return {
    headerName: "x-juris-csrf",
    cookieName: "__Host-juris-csrf"
  };
}
`,
);

write(
  "packages/security/src/headers.test.ts",
  `
import { describe, expect, it } from "vitest";
import { getSecurityHeaders, isTrustedOrigin } from "./index";

describe("security headers", () => {
  it("generates strict defaults", () => {
    const headers = getSecurityHeaders({ environment: "production", nonce: "abc" });
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Strict-Transport-Security"]).toContain("max-age");
  });

  it("validates trusted origins", () => {
    expect(isTrustedOrigin("http://localhost:3000")).toBe(true);
    expect(isTrustedOrigin("https://app.juris.example.com")).toBe(true);
  });
});
`,
);

writePackageBase("packages/telemetry", {
  name: "@repo/telemetry",
  version: packageVersion,
  private: true,
  type: "module",
  exports: {
    ".": "./src/index.ts",
  },
  scripts: basePackageScripts(false),
  dependencies: {
    "@opentelemetry/api": "^1.9.0",
  },
  devDependencies: {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
  },
});

write(
  "packages/telemetry/src/logger.ts",
  `
export type LogFields = Record<string, unknown>;

export type Logger = {
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
};

function serialize(serviceName: string, level: string, message: string, fields?: LogFields): string {
  return JSON.stringify({
    level,
    message,
    "service.name": serviceName,
    timestamp: new Date().toISOString(),
    ...fields
  });
}

export function createLogger(serviceName: string): Logger {
  return {
    info(message, fields) {
      console.info(serialize(serviceName, "info", message, fields));
    },
    warn(message, fields) {
      console.warn(serialize(serviceName, "warn", message, fields));
    },
    error(message, fields) {
      console.error(serialize(serviceName, "error", message, fields));
    }
  };
}
`,
);

write(
  "packages/telemetry/src/events.ts",
  `
import { trace } from "@opentelemetry/api";
import { createLogger } from "./logger";

export type TelemetryEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

export function trackEvent(serviceName: string, event: TelemetryEvent): void {
  const logger = createLogger(serviceName);
  const span = trace.getActiveSpan();
  logger.info("event tracked", {
    event: event.name,
    properties: event.properties,
    "trace.id": span?.spanContext().traceId
  });
}
`,
);

write(
  "packages/telemetry/src/request-context.ts",
  `
export type RequestContext = {
  requestId: string;
  correlationId: string;
  traceId?: string;
  locale?: string;
  tenantId?: string;
  userIdHash?: string;
  routeGroup?: string;
};

export function createRequestContext(init: Partial<RequestContext> = {}): RequestContext {
  const requestId = init.requestId ?? crypto.randomUUID();
  return {
    requestId,
    correlationId: init.correlationId ?? requestId,
    traceId: init.traceId,
    locale: init.locale,
    tenantId: init.tenantId,
    userIdHash: init.userIdHash,
    routeGroup: init.routeGroup
  };
}
`,
);

write(
  "packages/telemetry/src/web-vitals.ts",
  `
import { createLogger } from "./logger";

export type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
};

export function reportWebVitals(serviceName: string, metric: WebVitalMetric): void {
  createLogger(serviceName).info("web vital", {
    "web_vital.id": metric.id,
    "web_vital.name": metric.name,
    "web_vital.value": metric.value,
    "web_vital.rating": metric.rating
  });
}
`,
);

write(
  "packages/telemetry/src/index.ts",
  `
import { createLogger } from "./logger";

export * from "./events";
export * from "./logger";
export * from "./request-context";
export * from "./web-vitals";

export type TelemetrySetupOptions = {
  serviceName: string;
  version?: string;
  appName?: string;
  runtime?: string;
};

export function initializeTelemetry(options: TelemetrySetupOptions): void {
  createLogger(options.serviceName).info("telemetry initialized", {
    "service.version": options.version,
    "app.name": options.appName,
    runtime: options.runtime
  });
}
`,
);

writePackageBase("packages/platform", {
  name: "@repo/platform",
  version: packageVersion,
  private: true,
  type: "module",
  exports: {
    ".": "./src/index.ts",
    "./health": "./src/health.ts",
  },
  scripts: basePackageScripts(false),
  dependencies: {
    "@repo/contracts": "workspace:*",
  },
  devDependencies: {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
  },
});

write(
  "packages/platform/src/runtime.ts",
  `
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
`,
);

write(
  "packages/platform/src/env.ts",
  `
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
`,
);

write(
  "packages/platform/src/cache.ts",
  `
export type CacheStore = {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
};

type Entry = {
  value: unknown;
  expiresAt?: number;
};

export class InMemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, Entry>();

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.entries.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.entries.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
    });
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }
}
`,
);

write(
  "packages/platform/src/queue.ts",
  `
export type JobQueue<TPayload = unknown> = {
  enqueue(name: string, payload: TPayload): Promise<void>;
};

export class InMemoryJobQueue<TPayload = unknown> implements JobQueue<TPayload> {
  readonly jobs: Array<{ name: string; payload: TPayload }> = [];

  async enqueue(name: string, payload: TPayload): Promise<void> {
    this.jobs.push({ name, payload });
  }
}
`,
);

write(
  "packages/platform/src/object-store.ts",
  `
export type ObjectStore = {
  get(key: string): Promise<Uint8Array | undefined>;
  put(key: string, value: Uint8Array, contentType?: string): Promise<void>;
  delete(key: string): Promise<void>;
};

export class InMemoryObjectStore implements ObjectStore {
  private readonly objects = new Map<string, Uint8Array>();

  async get(key: string): Promise<Uint8Array | undefined> {
    return this.objects.get(key);
  }

  async put(key: string, value: Uint8Array): Promise<void> {
    this.objects.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }
}
`,
);

write(
  "packages/platform/src/health.ts",
  `
import type { AppManifest, HealthResponse, VersionResponse } from "@repo/contracts";
import { validateAppManifest } from "@repo/contracts";
import { getEnv } from "./env";

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {})
    }
  });
}

export function createLiveHealthResponse(manifest: AppManifest): Response {
  const body: HealthResponse = {
    status: "healthy",
    service: manifest.observability.serviceName,
    version: manifest.version,
    timestamp: new Date().toISOString()
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
      manifest: "ok"
    }
  };
  return jsonResponse(body);
}

export function createVersionResponse(manifest: AppManifest): Response {
  const body: VersionResponse = {
    name: manifest.name,
    version: manifest.version,
    gitSha: getEnv("GIT_SHA") ?? "local",
    buildTime: getEnv("BUILD_TIME") ?? new Date().toISOString(),
    runtime: manifest.runtime
  };
  return jsonResponse(body);
}
`,
);

write(
  "packages/platform/src/index.ts",
  `
export * from "./cache";
export * from "./env";
export * from "./health";
export * from "./object-store";
export * from "./queue";
export * from "./runtime";
`,
);

writePackageBase("packages/testing", {
  name: "@repo/testing",
  version: packageVersion,
  private: true,
  type: "module",
  exports: {
    ".": "./src/index.ts",
  },
  scripts: basePackageScripts(false),
  dependencies: {
    "@repo/auth": "workspace:*",
    "@repo/i18n": "workspace:*",
    "@testing-library/react": "^16.3.0",
    "next-intl": "4.12.0",
    "next-themes": "^0.4.6",
    react: "19.2.6",
  },
  devDependencies: {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
  },
});

write(
  "packages/testing/src/index.tsx",
  `
import { mockSession, mockTenants, mockUser } from "@repo/auth";
import { getMessages } from "@repo/i18n";
import type { Locale } from "@repo/i18n";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

export function createMockUser() {
  return mockUser;
}

export function createMockTenant() {
  return mockTenants[0];
}

export function createMockSession() {
  return mockSession;
}

export async function renderWithProviders(
  ui: ReactElement,
  options: { locale?: Locale; wrapper?: (children: ReactNode) => ReactNode } = {}
) {
  const locale = options.locale ?? "en";
  const messages = await getMessages(locale);

  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {options.wrapper ? options.wrapper(ui) : ui}
    </NextIntlClientProvider>
  );
}
`,
);

writePackageBase("packages/ui", {
  name: "@repo/ui",
  version: packageVersion,
  private: true,
  type: "module",
  exports: {
    ".": "./src/index.ts",
    "./styles.css": "./src/styles/globals.css",
  },
  scripts: {
    ...basePackageScripts(true),
    storybook: "storybook dev -p 6006",
    "storybook:build": "storybook build",
  },
  dependencies: {
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toast": "^1.2.15",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@repo/access-control": "workspace:*",
    "@repo/auth": "workspace:*",
    "@repo/tokens": "workspace:*",
    "class-variance-authority": "^0.7.1",
    clsx: "^2.1.1",
    cmdk: "^1.1.1",
    "lucide-react": "^0.468.0",
    "next-themes": "^0.4.6",
    react: "19.2.6",
    sonner: "^2.0.7",
    "tailwind-merge": "^3.4.0",
  },
  devDependencies: {
    "@repo/eslint-config": "workspace:*",
    "@repo/testing": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@storybook/addon-docs": "10.4.1",
    "@storybook/react-vite": "10.4.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    tailwindcss: "^3.4.18",
    vite: "^7.2.7",
  },
});

write(
  "packages/ui/tailwind.config.ts",
  `
import { tailwindPreset } from "@repo/tokens/tailwind-preset";
import type { Config } from "tailwindcss";

export default {
  presets: [tailwindPreset],
  content: ["./src/**/*.{ts,tsx}", "./.storybook/**/*.{ts,tsx}"]
} satisfies Config;
`,
);

write(
  "packages/ui/src/styles/globals.css",
  `
@import "@repo/tokens/theme.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }

  html {
    color-scheme: light;
  }

  html.dark {
    color-scheme: dark;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings:
      "rlig" 1,
      "calt" 1;
  }

  :focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }
}
`,
);

write(
  "packages/ui/src/lib/cn.ts",
  `
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
`,
);

write(
  "packages/ui/src/components/button.tsx",
  `
"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-11 px-6",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
      {children}
    </Comp>
  );
}
`,
);

write(
  "packages/ui/src/components/form.tsx",
  `
"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Check, ChevronDown } from "lucide-react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";
import { cn } from "../lib/cn";

export const Input = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Label = forwardRef<
  ElementRef<typeof LabelPrimitive.Root>,
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-sm font-medium leading-none", className)}
    {...props}
  />
));
Label.displayName = "Label";

export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded border border-primary shadow focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check aria-hidden="true" className="h-3.5 w-3.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";

export const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-muted transition-colors data-[state=checked]:bg-primary",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform data-[state=checked]:translate-x-5" />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown aria-hidden="true" className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-32 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check aria-hidden="true" className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";
`,
);

write(
  "packages/ui/src/components/badge.tsx",
  `
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-success text-white",
        warning: "border-transparent bg-warning text-black",
        danger: "border-transparent bg-danger text-white",
        muted: "border-transparent bg-muted text-muted-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
`,
);

write(
  "packages/ui/src/components/card.tsx",
  `
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border bg-card text-card-foreground shadow-soft", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold leading-none tracking-normal", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}
`,
);

write(
  "packages/ui/src/components/overlay.tsx",
  `
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as ToastPrimitive from "@radix-ui/react-toast";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { X } from "lucide-react";
import type { ComponentPropsWithoutRef, ElementRef, HTMLAttributes } from "react";
import { forwardRef } from "react";
import { Toaster as SonnerToaster } from "sonner";
import { cn } from "../lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/55", className)}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-[min(calc(100vw-2rem),32rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-raised",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
        <X aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

export const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-left", className)} {...props} />
);
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuItem = DropdownMenuPrimitive.Item;
export const DropdownMenuLabel = DropdownMenuPrimitive.Label;
export const DropdownMenuSeparator = DropdownMenuPrimitive.Separator;

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-48 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const Sheet = Dialog;
export const SheetTrigger = DialogTrigger;
export const SheetClose = DialogClose;
export const SheetContent = DialogContent;
export const SheetHeader = DialogHeader;
export const SheetTitle = DialogTitle;
export const SheetDescription = DialogDescription;

export const Tabs = TabsPrimitive.Root;
export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1", className)}
    {...props}
  />
));
TabsList.displayName = "TabsList";
export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";
export const TabsContent = TabsPrimitive.Content;

export const Separator = forwardRef<
  ElementRef<typeof SeparatorPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className
    )}
    {...props}
  />
));
Separator.displayName = "Separator";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn("z-50 rounded-md bg-foreground px-3 py-1.5 text-xs text-background", className)}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = ToastPrimitive.Viewport;
export const Toast = ToastPrimitive.Root;
export const ToastTitle = ToastPrimitive.Title;
export const ToastDescription = ToastPrimitive.Description;
export const Toaster = SonnerToaster;
`,
);

write(
  "packages/ui/src/components/avatar.tsx",
  `
"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";
import { cn } from "../lib/cn";

export const Avatar = forwardRef<
  ElementRef<typeof AvatarPrimitive.Root>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = "Avatar";

export const AvatarImage = forwardRef<
  ElementRef<typeof AvatarPrimitive.Image>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} />
));
AvatarImage.displayName = "AvatarImage";

export const AvatarFallback = forwardRef<
  ElementRef<typeof AvatarPrimitive.Fallback>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted text-sm", className)}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";
`,
);

write(
  "packages/ui/src/components/states.tsx",
  `
import { AlertCircle, FileSearch, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button";

export type StateAction = {
  label: string;
  onClick?: () => void;
  href?: string;
};

function StateFrame({
  icon,
  title,
  description,
  action
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: StateAction;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="mb-4 rounded-full bg-muted p-3 text-muted-foreground">{icon}</div>
      <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? (
        <Button asChild={Boolean(action.href)} className="mt-5" onClick={action.onClick}>
          {action.href ? <a href={action.href}>{action.label}</a> : <span>{action.label}</span>}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState(props: { title: string; description?: string; action?: StateAction }) {
  return <StateFrame icon={<FileSearch className="h-5 w-5" />} {...props} />;
}

export function ErrorState(props: { title: string; description?: string; action?: StateAction }) {
  return <StateFrame icon={<AlertCircle className="h-5 w-5" />} {...props} />;
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground">
      <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
`,
);

write(
  "packages/ui/src/components/alert.tsx",
  `
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

const alertVariants = cva("relative w-full rounded-lg border p-4 text-sm", {
  variants: {
    variant: {
      default: "bg-background text-foreground",
      info: "border-info/40 bg-info/10 text-foreground",
      warning: "border-warning/50 bg-warning/10 text-foreground",
      danger: "border-danger/50 bg-danger/10 text-foreground",
      success: "border-success/50 bg-success/10 text-foreground"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export type AlertProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>;

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="status" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn("mb-1 font-medium leading-none tracking-normal", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
`,
);

write(
  "packages/ui/src/components/table.tsx",
  `
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-b transition-colors hover:bg-muted/50", className)} {...props} />;
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("h-10 px-4 text-left align-middle text-xs font-medium uppercase text-muted-foreground", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("p-4 align-middle", className)} {...props} />;
}
`,
);

write(
  "packages/ui/src/components/navigation.tsx",
  `
"use client";

import type { Session, Tenant, User } from "@repo/auth";
import { hasPermission } from "@repo/access-control";
import {
  BarChart3,
  Bell,
  Building2,
  Check,
  ChevronsUpDown,
  CreditCard,
  Home,
  Languages,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Shield,
  Sun,
  UserCircle
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "./overlay";
import { cn } from "../lib/cn";

export type NavItem = {
  label: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  permission?: string;
  external?: boolean;
};

export const platformNavIcons = {
  home: Home,
  console: LayoutDashboard,
  admin: Shield,
  billing: CreditCard,
  reporting: BarChart3,
  settings: Settings,
  support: LifeBuoy
} as const;

export function MainNav({ items }: { items: NavItem[] }) {
  return (
    <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.href}
            href={item.href}
            className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

export function SidebarNav({ items, session }: { items: NavItem[]; session?: Session }) {
  const visibleItems = items.filter((item) => !item.permission || hasPermission(session, item.permission));

  return (
    <nav aria-label="Sidebar navigation" className="grid gap-1">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.href}
            href={item.href}
            className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export function ThemeProvider(props: React.ComponentProps<typeof import("next-themes").ThemeProvider>) {
  const { ThemeProvider: NextThemeProvider } = require("next-themes") as typeof import("next-themes");
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange {...props} />
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Toggle theme"
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle theme</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function LocaleSwitcher({
  locale,
  labels = { en: "English", sw: "Kiswahili", fr: "Français" }
}: {
  locale: "en" | "sw" | "fr";
  labels?: Record<"en" | "sw" | "fr", string>;
}) {
  const pathname = typeof window === "undefined" ? "/" + locale : window.location.pathname;
  const hrefFor = (nextLocale: "en" | "sw" | "fr") => {
    const segments = pathname.split("/");
    if (["en", "sw", "fr"].includes(segments[1] ?? "")) {
      segments[1] = nextLocale;
      return segments.join("/") || "/" + nextLocale;
    }

    return "/" + nextLocale + pathname;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Change language" variant="ghost" size="icon">
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(["en", "sw", "fr"] as const).map((nextLocale) => (
          <DropdownMenuItem key={nextLocale} asChild>
            <a href={hrefFor(nextLocale)} className="flex items-center justify-between gap-4">
              <span>{labels[nextLocale]}</span>
              {locale === nextLocale ? <Check className="h-4 w-4" /> : null}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TenantSwitcher({
  tenant,
  tenants
}: {
  tenant?: Tenant;
  tenants: Tenant[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="max-w-56 justify-between">
          <Building2 className="h-4 w-4" />
          <span className="truncate">{tenant?.name ?? "Select tenant"}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Tenants</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((item) => (
          <DropdownMenuItem key={item.id}>
            <Building2 className="mr-2 h-4 w-4" />
            {item.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserMenu({ user }: { user?: User }) {
  const initials = useMemo(
    () =>
      (user?.name ?? "User")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2),
    [user?.name]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-3 px-2">
          <Avatar className="h-8 w-8">
            {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm md:inline">{user?.name ?? "User"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user?.email ?? "Local user"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserCircle className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PermissionGate({
  session,
  permission,
  fallback,
  children
}: {
  session?: Session;
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  if (!hasPermission(session, permission)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

export function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function AppShell({
  appName,
  navItems,
  user,
  tenant,
  tenants,
  locale,
  session,
  breadcrumb,
  children
}: {
  appName: string;
  navItems: NavItem[];
  user?: User;
  tenant?: Tenant;
  tenants: Tenant[];
  locale: "en" | "sw" | "fr";
  session?: Session;
  breadcrumb?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col gap-6">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          J
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Juris</p>
          <p className="text-xs text-muted-foreground">{appName}</p>
        </div>
      </div>
      <div className="px-3">
        <SidebarNav items={navItems} session={session} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-card lg:block">{sidebar}</aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button aria-label="Open navigation" variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="left-0 top-0 h-screen w-80 translate-x-0 translate-y-0 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              {sidebar}
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="truncate">{appName}</span>
              <Badge variant="success">Live</Badge>
            </div>
            <div className="hidden md:block">{breadcrumb}</div>
          </div>
          <Button aria-label="Search" variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button aria-label="Notifications" variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <TenantSwitcher tenant={tenant} tenants={tenants} />
          <LocaleSwitcher locale={locale} />
          <ThemeToggle />
          <UserMenu user={user} />
        </header>
        <main id="main-content" className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
`,
);

write(
  "packages/ui/src/components/data.tsx",
  `
import type { AuditEvent } from "@repo/contracts";
import type { ComponentType, ReactNode } from "react";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export type StatusKind =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "draft"
  | "active"
  | "inactive"
  | "pending"
  | "success"
  | "warning"
  | "danger";

const statusVariant: Record<StatusKind, "success" | "warning" | "danger" | "muted" | "secondary"> = {
  healthy: "success",
  success: "success",
  active: "success",
  degraded: "warning",
  warning: "warning",
  pending: "warning",
  unavailable: "danger",
  danger: "danger",
  draft: "muted",
  inactive: "muted"
};

export function StatusBadge({ status }: { status: StatusKind }) {
  return <Badge variant={statusVariant[status]}>{status}</Badge>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={"animate-pulse rounded-md bg-muted " + className} />;
}

export function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  description
}: {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "flat";
  icon?: ComponentType<{ className?: string }>;
  description?: string;
}) {
  const trendClass =
    trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {change ? <p className={"mt-1 text-xs " + trendClass}>{change}</p> : null}
        {description ? <p className="mt-2 text-xs text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  );
}

export function DataTable({
  columns,
  rows
}: {
  columns: string[];
  rows: Array<Record<string, ReactNode>>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell key={column}>{row[column]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AuditEventList({ events }: { events: AuditEvent[] }) {
  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <div key={event.id} className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">{event.action}</p>
            <p className="text-xs text-muted-foreground">
              {event.actor} · {event.target}
            </p>
          </div>
          <StatusBadge status={event.severity === "info" ? "active" : event.severity} />
        </div>
      ))}
    </div>
  );
}
`,
);

write(
  "packages/ui/src/components/command.tsx",
  `
"use client";

import { Command as CommandPrimitive } from "cmdk";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";
import { cn } from "../lib/cn";

export const Command = forwardRef<
  ElementRef<typeof CommandPrimitive>,
  ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className)}
    {...props}
  />
));
Command.displayName = "Command";

export const CommandInput = forwardRef<
  ElementRef<typeof CommandPrimitive.Input>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Input
    ref={ref}
    className={cn("flex h-11 w-full rounded-md bg-transparent px-3 py-3 text-sm outline-none", className)}
    {...props}
  />
));
CommandInput.displayName = "CommandInput";

export const CommandList = CommandPrimitive.List;
export const CommandEmpty = CommandPrimitive.Empty;
export const CommandGroup = CommandPrimitive.Group;
export const CommandItem = CommandPrimitive.Item;
`,
);

write(
  "packages/ui/src/components/page-header.tsx",
  `
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
`,
);

write(
  "packages/ui/src/index.ts",
  `
export * from "./components/alert";
export * from "./components/avatar";
export * from "./components/badge";
export * from "./components/button";
export * from "./components/card";
export * from "./components/command";
export * from "./components/data";
export * from "./components/form";
export * from "./components/navigation";
export * from "./components/overlay";
export * from "./components/page-header";
export * from "./components/states";
export * from "./components/table";
export * from "./lib/cn";
`,
);

write(
  "packages/ui/src/lib/cn.test.ts",
  `
import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("merges conflicting classes", () => {
    expect(cn("px-2", "px-4", { hidden: false, block: true })).toBe("px-4 block");
  });
});
`,
);

write(
  "packages/ui/src/components/button.test.tsx",
  `
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders and handles clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
`,
);

write(
  "packages/ui/src/components/app-shell.test.tsx",
  `
import { mockSession } from "@repo/auth";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell, PermissionGate, platformNavIcons } from "./navigation";

describe("AppShell", () => {
  it("renders app navigation and content", () => {
    render(
      <AppShell
        appName="Console"
        locale="en"
        navItems={[{ label: "Console", href: "/en/console", icon: platformNavIcons.console }]}
        session={mockSession}
        user={mockSession.user}
        tenant={mockSession.currentTenant}
        tenants={mockSession.availableTenants}
      >
        <h1>Dashboard</h1>
      </AppShell>
    );
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getAllByText("Console").length).toBeGreaterThan(0);
  });

  it("hides content without permission", () => {
    render(
      <PermissionGate session={mockSession} permission="admin:write" fallback={<p>Denied</p>}>
        <p>Allowed</p>
      </PermissionGate>
    );
    expect(screen.getByText("Denied")).toBeInTheDocument();
  });
});
`,
);

write(
  "packages/ui/src/components/theme-toggle.test.tsx",
  `
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./navigation";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() })
}));

describe("ThemeToggle", () => {
  it("renders an accessible control", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });
});
`,
);

write(
  "packages/ui/.storybook/main.ts",
  `
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  docs: {
    autodocs: "tag"
  }
};

export default config;
`,
);

write(
  "packages/ui/.storybook/preview.tsx",
  `
import type { Preview } from "@storybook/react-vite";
import "../src/styles/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
};

export default preview;
`,
);

write(
  "packages/ui/src/components/ui.stories.tsx",
  `
import { Activity, CreditCard } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AppShell,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LocaleSwitcher,
  MetricCard,
  StatusBadge,
  ThemeToggle,
  platformNavIcons
} from "../index";

const meta = {
  title: "Juris UI/Components",
  parameters: {
    layout: "centered"
  }
} satisfies Meta;

export default meta;

export const ButtonStory: StoryObj = {
  name: "Button",
  render: () => (
    <div className="flex gap-2">
      <Button>Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
    </div>
  )
};

export const CardStory: StoryObj = {
  name: "Card",
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Operational posture</CardTitle>
      </CardHeader>
      <CardContent>All app manifests validate successfully.</CardContent>
    </Card>
  )
};

export const AppShellStory: StoryObj = {
  name: "AppShell",
  parameters: { layout: "fullscreen" },
  render: () => (
    <AppShell
      appName="Console"
      locale="en"
      navItems={[
        { label: "Console", href: "/en/console", icon: platformNavIcons.console },
        { label: "Billing", href: "/en/billing", icon: platformNavIcons.billing }
      ]}
      tenants={[{ id: "tenant_alpha", name: "Acme Legal Group", slug: "acme" }]}
      tenant={{ id: "tenant_alpha", name: "Acme Legal Group", slug: "acme" }}
      user={{ id: "user_1", name: "Amara Okafor", email: "amara@example.com" }}
    >
      <MetricCard title="Active tenants" value="128" icon={Activity} />
    </AppShell>
  )
};

export const EmptyStateStory: StoryObj = {
  name: "EmptyState",
  render: () => <EmptyState title="No invoices yet" description="Invoices will appear after billing runs." />
};

export const ErrorStateStory: StoryObj = {
  name: "ErrorState",
  render: () => <ErrorState title="Unable to load" description="Retry when the service is ready." />
};

export const StatusBadgeStory: StoryObj = {
  name: "StatusBadge",
  render: () => (
    <div className="flex gap-2">
      <StatusBadge status="healthy" />
      <StatusBadge status="degraded" />
      <StatusBadge status="unavailable" />
    </div>
  )
};

export const ThemeToggleStory: StoryObj = {
  name: "ThemeToggle",
  render: () => <ThemeToggle />
};

export const LocaleSwitcherStory: StoryObj = {
  name: "LocaleSwitcher",
  render: () => <LocaleSwitcher locale="en" />
};

export const MetricCardStory: StoryObj = {
  name: "MetricCard",
  render: () => (
    <MetricCard title="Monthly revenue" value="$428K" change="+12.4%" trend="up" icon={CreditCard} />
  )
};
`,
);

function appManifestSource(app) {
  return `
import {
  AppCriticality,
  AppRuntime,
  Locale,
  validateAppManifest
} from "@repo/contracts";

export const appManifest = validateAppManifest({
  name: "${app.name}",
  displayName: "${app.displayName}",
  basePath: "${app.basePath}",
  owner: "${app.owner}",
  version: "${packageVersion}",
  criticality: AppCriticality.${app.criticality === "tier-1" ? "Tier1" : app.criticality === "tier-2" ? "Tier2" : "Tier3"},
  runtime: AppRuntime.CloudflareWorkers,
  requiredPlatformVersion: "^${packageVersion}",
  permissions: ["${app.permission}"],
  locales: [Locale.En, Locale.Sw, Locale.Fr],
  health: {
    live: "/api/health/live",
    ready: "/api/health/ready",
    version: "/api/health/version"
  },
  observability: {
    serviceName: "${app.serviceName}"
  }
});
`;
}

function layoutSource(app) {
  return `
import "@repo/ui/styles.css";
import { getDirection, getMessages, isLocale, locales } from "@repo/i18n";
import { ThemeProvider, Toaster } from "@repo/ui";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: "Juris ${app.displayName}",
  description: "Juris ${app.displayName} frontend"
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);

  return (
    <html lang={locale} dir={getDirection(locale)} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            {children}
            <Toaster richColors closeButton />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
`;
}

function middlewareSource() {
  return `
import { defaultLocale, isLocale } from "@repo/i18n";
import { getEnv } from "@repo/platform";
import { createNonce, getSecurityHeaders } from "@repo/security";
import { NextResponse, type NextRequest } from "next/server";

function withSecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders({
    environment: getEnv("NEXT_PUBLIC_APP_ENV") ?? getEnv("NODE_ENV") ?? "production",
    nonce: createNonce(),
    appName: "juris"
  });

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return withSecurityHeaders(NextResponse.next());
  }

  const locale = pathname.split("/")[1];

  if (!isLocale(locale)) {
    const url = request.nextUrl.clone();
    url.pathname = "/" + defaultLocale + (pathname === "/" ? "" : pathname);
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
`;
}

function appPackage(app) {
  return {
    name: `@juris/${app.name}`,
    version: packageVersion,
    private: true,
    type: "module",
    scripts: {
      dev: `next dev --port ${app.port}`,
      build: "next build",
      "build:cloudflare": "opennextjs-cloudflare build",
      "preview:cloudflare": "opennextjs-cloudflare preview",
      "deploy:cloudflare": "opennextjs-cloudflare deploy",
      lint: "eslint .",
      typecheck: "tsc --noEmit",
      test: "vitest run",
      "test:watch": "vitest",
      "test:coverage": "vitest run --coverage",
      clean: "rm -rf .next .open-next dist coverage",
    },
    dependencies: commonAppDeps(),
    devDependencies: {
      "@repo/eslint-config": "workspace:*",
      "@repo/testing": "workspace:*",
      "@repo/typescript-config": "workspace:*",
      "@testing-library/jest-dom": "^6.9.1",
      "@testing-library/react": "^16.3.0",
      "@testing-library/user-event": "^14.6.1",
      "@types/node": "^24.10.1",
      "@types/react": "^19.2.7",
      "@types/react-dom": "^19.2.3",
      "@vitest/coverage-v8": "4.1.7",
      eslint: "10.4.0",
      tailwindcss: "^3.4.18",
      typescript: "5.8.3",
      vitest: "4.1.7",
      wrangler: "^4.57.1",
    },
  };
}

function sharedNextConfig(app) {
  return `
import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true"
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ${JSON.stringify(repoPackages)},
  experimental: {
    optimizePackageImports: ["lucide-react"]
  }
};

export default withBundleAnalyzer(nextConfig);
`;
}

function tailwindConfig() {
  return `
import { tailwindPreset } from "@repo/tokens/tailwind-preset";
import type { Config } from "tailwindcss";

export default {
  presets: [tailwindPreset],
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"]
} satisfies Config;
`;
}

function tsconfigApp() {
  return `
{
  "extends": "@repo/typescript-config/nextjs",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;
}

function healthRoute(kind) {
  const fn =
    kind === "live"
      ? "createLiveHealthResponse"
      : kind === "ready"
        ? "createReadyHealthResponse"
        : "createVersionResponse";
  return `
import { ${fn} } from "@repo/platform/health";
import { appManifest } from "@/manifest";

export const runtime = "edge";

export function GET() {
  return ${fn}(appManifest);
}
`;
}

function pageChromeImports(extra = "") {
  return `
import { createTranslator } from "next-intl";
import { getMessages } from "@repo/i18n";
import type { Locale } from "@repo/i18n";
import { getMockSession } from "@repo/auth";
import {
  AppShell,
  AuditEventList,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  EmptyState,
  MetricCard,
  PageHeader,
  PermissionGate,
  StatusBadge,
  platformNavIcons
} from "@repo/ui";
${extra}
`;
}

function productNavSource(app) {
  return `
export function getNavItems(locale: string) {
  return [
    { label: "Console", href: "/" + locale + "/console", icon: platformNavIcons.console, permission: "console:read" },
    { label: "Admin", href: "/" + locale + "/admin", icon: platformNavIcons.admin, permission: "admin:read" },
    { label: "Billing", href: "/" + locale + "/billing", icon: platformNavIcons.billing, permission: "billing:read" },
    { label: "Reports", href: "/" + locale + "/reports", icon: platformNavIcons.reporting, permission: "reporting:read" },
    { label: "Settings", href: "/" + locale + "/settings", icon: platformNavIcons.settings, permission: "settings:read" },
    { label: "Support", href: "/" + locale + "/support", icon: platformNavIcons.support, permission: "support:read" }
  ];
}

export function getBreadcrumb(locale: string, label: string) {
  return <Breadcrumb items={[{ label: "Juris", href: "/" + locale }, { label: "${app.displayName}" }, { label }]} />;
}
`;
}

function appRootPage(app) {
  const target =
    app.name === "public"
      ? "/en"
      : app.name === "identity"
        ? "/en/login"
        : `/en/${app.productPath}`;
  return `
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("${target}");
}
`;
}

function publicHomePage() {
  return `
import { createTranslator } from "next-intl";
import { getMessages } from "@repo/i18n";
import type { Locale } from "@repo/i18n";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LocaleSwitcher,
  MetricCard,
  ThemeToggle
} from "@repo/ui";
import { ArrowRight, Building2, CheckCircle2, LockKeyhole, Network, ShieldCheck } from "lucide-react";

export default async function PublicHomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages });

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        <a href={"/" + locale} className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">J</span>
          {t("common.appName")}
        </a>
        <nav className="hidden items-center gap-2 md:flex" aria-label="Public navigation">
          <a className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground" href={"/" + locale + "/about"}>About</a>
          <a className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground" href={"/" + locale + "/pricing"}>Pricing</a>
          <a className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground" href={"/" + locale + "/security"}>Security</a>
        </nav>
        <div className="flex items-center gap-2">
          <LocaleSwitcher locale={locale} />
          <ThemeToggle />
          <Button asChild>
            <a href={"/" + locale + "/login"}>{t("auth.login")}</a>
          </Button>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border px-3 py-1 text-sm text-muted-foreground">
            Enterprise legal operations platform
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-normal md:text-6xl">Juris</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            A resilient microfrontend platform for legal, billing, reporting, support, and workspace operations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={"/" + locale + "/login"}>
                Start securely <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={"/" + locale + "/security"}>Security posture</a>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 rounded-lg border bg-card p-4 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard title="Availability target" value="99.95%" change="independent apps" trend="up" icon={ShieldCheck} />
            <MetricCard title="Active tenants" value="128" change="+14 this quarter" trend="up" icon={Building2} />
            <MetricCard title="Policy checks" value="42K" change="last 24 hours" trend="flat" icon={LockKeyhole} />
            <MetricCard title="Routes owned" value="8" change="path-based products" trend="up" icon={Network} />
          </div>
        </div>
      </section>
      <section className="border-y bg-muted/35">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 md:grid-cols-3">
          {[
            ["Independent apps", "Every capability can run, build, and deploy without another frontend app."],
            ["Shared design system", "shadcn/ui foundations wrapped in Juris enterprise components."],
            ["Operational defaults", "Health checks, manifests, security headers, and telemetry from day one."]
          ].map(([title, description]) => (
            <Card key={title}>
              <CardHeader>
                <CheckCircle2 className="h-5 w-5 text-success" />
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
            </Card>
          ))}
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>© 2026 Juris</span>
        <span>Cloudflare-ready · Next.js 15 · React 19</span>
      </footer>
    </main>
  );
}
`;
}

function publicSubPage(title, description) {
  return `
import type { Locale } from "@repo/i18n";
import { Button, Card, CardContent, CardHeader, CardTitle, LocaleSwitcher, ThemeToggle } from "@repo/ui";

export default async function PublicSubPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        <a href={"/" + locale} className="font-semibold">Juris</a>
        <div className="flex items-center gap-2">
          <LocaleSwitcher locale={locale} />
          <ThemeToggle />
        </div>
      </header>
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-semibold tracking-normal">${title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">${description}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Enterprise controls</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">Typed contracts, health endpoints, and security defaults keep teams aligned.</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Operational clarity</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">Each product surface owns its route, manifest, observability name, and deploy pipeline.</CardContent>
          </Card>
        </div>
        <Button asChild className="mt-8"><a href={"/" + locale}>Back home</a></Button>
      </section>
    </main>
  );
}
`;
}

function loginActionsSource() {
  return `
"use client";

import { Button } from "@repo/ui";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export function LoginActions({ locale }: { locale: string }) {
  const router = useRouter();

  return (
    <div className="grid gap-3">
      <Button type="button" onClick={() => router.push("/" + locale + "/console")}>
        Continue with mock session
      </Button>
      <Button type="button" variant="outline">
        <ShieldCheck className="h-4 w-4" />
        Enterprise SSO
      </Button>
    </div>
  );
}
`;
}

function identityPage(kind) {
  const titles = {
    login: "Sign in",
    register: "Create your workspace",
    "forgot-password": "Reset password",
    logout: "Signed out",
  };
  const descriptions = {
    login:
      "Use the local mock session or start an enterprise SSO flow placeholder.",
    register: "Create a tenant-ready workspace for evaluation.",
    "forgot-password": "Request a reset link for your enterprise account.",
    logout: "Your local mock session has been cleared for this browser.",
  };
  const showPassword = kind === "login" || kind === "register";
  const button =
    kind === "forgot-password"
      ? "Send reset link"
      : kind === "register"
        ? "Create account"
        : "Continue";
  return `
import type { Locale } from "@repo/i18n";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, ThemeToggle, LocaleSwitcher } from "@repo/ui";
${kind === "login" ? 'import { LoginActions } from "@/components/login-actions";' : ""}

export default async function IdentityPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return (
    <main className="grid min-h-screen bg-muted/30 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden border-r bg-card p-10 lg:flex lg:flex-col lg:justify-between">
        <a href={"/" + locale} className="text-lg font-semibold">Juris</a>
        <div>
          <h1 className="text-4xl font-semibold tracking-normal">Identity fabric for enterprise teams.</h1>
          <p className="mt-4 text-muted-foreground">Mock authentication keeps local development fast while contracts remain ready for OIDC and SAML providers.</p>
        </div>
        <p className="text-sm text-muted-foreground">Protected by secure headers and typed session boundaries.</p>
      </section>
      <section className="flex flex-col">
        <header className="flex justify-end gap-2 p-4">
          <LocaleSwitcher locale={locale} />
          <ThemeToggle />
        </header>
        <div className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>${titles[kind]}</CardTitle>
              <CardDescription>${descriptions[kind]}</CardDescription>
            </CardHeader>
            <CardContent>
              ${
                kind === "logout"
                  ? `<Button asChild className="w-full"><a href={"/" + locale + "/login"}>Return to sign in</a></Button>`
                  : `<form className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="amara@example.com" autoComplete="email" />
                </div>
                ${
                  showPassword
                    ? `<div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" autoComplete="${kind === "register" ? "new-password" : "current-password"}" />
                </div>`
                    : ""
                }
                ${
                  kind === "login"
                    ? `<LoginActions locale={locale} />`
                    : `<Button type="button">${button}</Button>`
                }
              </form>`
              }
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
`;
}

function mockDataSource(app) {
  if (app.name === "console") {
    return `
export const metrics = [
  { title: "Active Tenants", value: "128", change: "+8.2%", trend: "up" as const },
  { title: "API Requests", value: "8.4M", change: "+14.1%", trend: "up" as const },
  { title: "Open Tickets", value: "23", change: "-6 today", trend: "down" as const },
  { title: "Error Rate", value: "0.08%", change: "stable", trend: "flat" as const }
];

export const activityRows = [
  { Event: "Matter export completed", Tenant: "Acme Legal Group", Status: "active" },
  { Event: "Policy review queued", Tenant: "Nova Compliance", Status: "pending" },
  { Event: "New user invited", Tenant: "Kilimani Chambers", Status: "active" }
];
`;
  }
  if (app.name === "admin") {
    return `
export const users = [
  { Name: "Amara Okafor", Role: "Admin", Status: "active" },
  { Name: "Louis Martin", Role: "Auditor", Status: "pending" },
  { Name: "Neema Mwangi", Role: "Support", Status: "active" }
];

export const tenants = [
  { Name: "Acme Legal Group", Plan: "Enterprise", Status: "active" },
  { Name: "Nova Compliance", Plan: "Business", Status: "active" },
  { Name: "Kilimani Chambers", Plan: "Business", Status: "inactive" }
];

export const auditEvents = [
  { id: "evt_1", actor: "Amara Okafor", action: "Updated tenant policy", target: "Acme Legal Group", severity: "info" as const, occurredAt: "2026-05-23T08:00:00.000Z" },
  { id: "evt_2", actor: "System", action: "Blocked risky session", target: "Nova Compliance", severity: "warning" as const, occurredAt: "2026-05-23T09:00:00.000Z" }
];
`;
  }
  if (app.name === "billing") {
    return `
export const invoices = [
  { Invoice: "INV-1048", Customer: "Acme Legal Group", Amount: 42800, Status: "pending" },
  { Invoice: "INV-1047", Customer: "Nova Compliance", Amount: 18900, Status: "active" },
  { Invoice: "INV-1046", Customer: "Kilimani Chambers", Amount: 12400, Status: "active" }
];

export const plans = [
  { name: "Business", price: 1200, description: "Core operational workflows for growing teams." },
  { name: "Enterprise", price: 4200, description: "Advanced governance, support, and controls." }
];
`;
  }
  if (app.name === "reporting") {
    return `
export const reportMetrics = [
  { title: "Report Exports", value: "1,842", change: "+18%", trend: "up" as const },
  { title: "Usage Growth", value: "24%", change: "last 30 days", trend: "up" as const },
  { title: "Performance P95", value: "412ms", change: "-34ms", trend: "up" as const }
];

export const exportsRows = [
  { Report: "Tenant activity", Owner: "Amara", Status: "active" },
  { Report: "Billing forecast", Owner: "Louis", Status: "pending" },
  { Report: "Security events", Owner: "Neema", Status: "active" }
];
`;
  }
  if (app.name === "settings") {
    return `
export const preferences = [
  { key: "Digest email", value: "Weekly" },
  { key: "Default locale", value: "English" },
  { key: "Session timeout", value: "60 minutes" }
];
`;
  }
  if (app.name === "support") {
    return `
export const tickets = [
  { Ticket: "SUP-3210", Subject: "Invoice export delay", Status: "pending" },
  { Ticket: "SUP-3208", Subject: "SSO certificate rotation", Status: "active" },
  { Ticket: "SUP-3199", Subject: "Report permissions", Status: "active" }
];

export const articles = [
  { title: "Configure enterprise SSO", description: "Prepare OIDC and SAML metadata for launch." },
  { title: "Manage tenant access", description: "Review RBAC and tenant membership patterns." },
  { title: "Export audit evidence", description: "Generate reporting packs for reviewers." }
];
`;
  }
  return "";
}

function productPage(app, route = "") {
  const appTitle =
    app.name === "console"
      ? "Customer Console"
      : app.name === "admin"
        ? "Admin Operations"
        : app.displayName;
  const routeTitle = route
    ? route
        .split("-")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" ")
    : appTitle;
  const importData =
    app.name === "console"
      ? 'import { activityRows, metrics } from "@/mock-data";'
      : app.name === "admin"
        ? 'import { auditEvents, tenants, users } from "@/mock-data";'
        : app.name === "billing"
          ? 'import { invoices, plans } from "@/mock-data";\nimport { formatCurrency } from "@repo/i18n";'
          : app.name === "reporting"
            ? 'import { exportsRows, reportMetrics } from "@/mock-data";\nimport { formatDate } from "@repo/i18n";'
            : app.name === "settings"
              ? 'import { preferences } from "@/mock-data";'
              : app.name === "support"
                ? 'import { articles, tickets } from "@/mock-data";'
                : "";
  return `
${pageChromeImports(importData)}
${productNavSource(app)}

export default async function ProductPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages });
  const session = await getMockSession();
  const navItems = getNavItems(locale);

  return (
    <AppShell
      appName="${app.displayName}"
      navItems={navItems}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      breadcrumb={getBreadcrumb(locale, "${routeTitle}")}
    >
      <PermissionGate
        session={session}
        permission="${app.permission}"
        fallback={<EmptyState title="Access denied" description="Your mock session does not include this permission." />}
      >
        <PageHeader
          title="${routeTitle}"
          description="${descriptionFor(app.name, route)}"
          actions={<Button variant="outline">{t("common.search")}</Button>}
        />
        ${bodyFor(app.name, route)}
      </PermissionGate>
    </AppShell>
  );
}
`;
}

function descriptionFor(appName, route) {
  const value = {
    console:
      "Operational metrics, tenant activity, and customer workflow health.",
    admin: "Internal controls for users, tenants, and audit evidence.",
    billing:
      "Revenue workflows with invoice, plan, and payment method visibility.",
    reporting:
      "Analytics, exports, and stale data awareness for enterprise reporting.",
    settings: "User and organization preferences with secure defaults.",
    support: "Ticket, knowledge base, and contact workflows for service teams.",
  }[appName];
  return route
    ? `${value} This view focuses on ${route.replaceAll("-", " ")}.`
    : value;
}

function bodyFor(appName, route) {
  if (appName === "console") {
    return `<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
        </div>
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle><CardDescription>Tenant operations from the last 24 hours.</CardDescription></CardHeader>
          <CardContent><DataTable columns={["Event", "Tenant", "Status"]} rows={activityRows.map((row) => ({ ...row, Status: <StatusBadge status={row.Status as "active" | "pending"} /> }))} /></CardContent>
        </Card>`;
  }
  if (appName === "admin") {
    return `<div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Users</CardTitle></CardHeader><CardContent><DataTable columns={["Name", "Role", "Status"]} rows={users.map((row) => ({ ...row, Status: <StatusBadge status={row.Status as "active" | "pending"} /> }))} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Tenants</CardTitle></CardHeader><CardContent><DataTable columns={["Name", "Plan", "Status"]} rows={tenants.map((row) => ({ ...row, Status: <StatusBadge status={row.Status as "active" | "inactive"} /> }))} /></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Audit events</CardTitle></CardHeader><CardContent><AuditEventList events={auditEvents} /></CardContent></Card>`;
  }
  if (appName === "billing") {
    return `<Card className="border-warning/40 bg-warning/10"><CardContent className="pt-6 text-sm">Some data may be delayed. Read-only mode is active.</CardContent></Card>
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => <Card key={plan.name}><CardHeader><CardTitle>{plan.name}</CardTitle><CardDescription>{plan.description}</CardDescription></CardHeader><CardContent><div className="text-2xl font-semibold">{formatCurrency(plan.price, locale)}</div><Button className="mt-4" disabled>Change plan</Button></CardContent></Card>)}
        </div>
        <Card><CardHeader><CardTitle>Invoices</CardTitle></CardHeader><CardContent><DataTable columns={["Invoice", "Customer", "Amount", "Status"]} rows={invoices.map((row) => ({ ...row, Amount: formatCurrency(row.Amount, locale), Status: <StatusBadge status={row.Status as "active" | "pending"} /> }))} /></CardContent></Card>`;
  }
  if (appName === "reporting") {
    return `<Card className="border-info/40 bg-info/10"><CardContent className="pt-6 text-sm">Some data may be delayed. Read-only mode is active. Last refreshed {formatDate("2026-05-23T08:00:00.000Z", locale)}.</CardContent></Card>
        <div className="grid gap-4 md:grid-cols-3">{reportMetrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}</div>
        <Card><CardHeader><CardTitle>Export queue</CardTitle></CardHeader><CardContent><DataTable columns={["Report", "Owner", "Status"]} rows={exportsRows.map((row) => ({ ...row, Status: <StatusBadge status={row.Status as "active" | "pending"} /> }))} /></CardContent></Card>`;
  }
  if (appName === "settings") {
    return `<div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Card><CardHeader><CardTitle>Profile</CardTitle><CardDescription>Mock profile values for local development.</CardDescription></CardHeader><CardContent className="grid gap-4"><div className="grid gap-2"><span className="text-sm font-medium">Name</span><span className="rounded-md border px-3 py-2 text-sm">Amara Okafor</span></div><div className="grid gap-2"><span className="text-sm font-medium">Email</span><span className="rounded-md border px-3 py-2 text-sm">amara.okafor@example.com</span></div><Button>Save</Button></CardContent></Card>
          <Card><CardHeader><CardTitle>Preferences</CardTitle></CardHeader><CardContent><DataTable columns={["key", "value"]} rows={preferences} /></CardContent></Card>
        </div>`;
  }
  if (appName === "support") {
    return `<div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Card><CardHeader><CardTitle>Tickets</CardTitle></CardHeader><CardContent><DataTable columns={["Ticket", "Subject", "Status"]} rows={tickets.map((row) => ({ ...row, Status: <StatusBadge status={row.Status as "active" | "pending"} /> }))} /></CardContent></Card>
          <div className="grid gap-4">{articles.map((article) => <Card key={article.title}><CardHeader><CardTitle>{article.title}</CardTitle><CardDescription>{article.description}</CardDescription></CardHeader></Card>)}</div>
        </div>`;
  }
  return `<EmptyState title="Coming soon" />`;
}

function writeNextApp(app) {
  const appPath = `apps/${app.name}`;
  packageJson(appPath, appPackage(app));
  write(`${appPath}/tsconfig.json`, tsconfigApp());
  write(`${appPath}/next.config.ts`, sharedNextConfig(app));
  write(`${appPath}/tailwind.config.ts`, tailwindConfig());
  write(
    `${appPath}/postcss.config.mjs`,
    `export { default } from "../../postcss.config.mjs";\n`,
  );
  write(
    `${appPath}/eslint.config.mjs`,
    `
import config from "@repo/eslint-config/next";

export default config;
`,
  );
  write(
    `${appPath}/vitest.config.ts`,
    `
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true
  }
});
`,
  );
  write(
    `${appPath}/vitest.setup.ts`,
    `import "@testing-library/jest-dom/vitest";\n`,
  );
  write(
    `${appPath}/next-env.d.ts`,
    `
/// <reference types="next" />
/// <reference types="next/image-types/global" />
`,
  );
  write(`${appPath}/src/manifest.ts`, appManifestSource(app));
  write(
    `${appPath}/src/manifest.test.ts`,
    `
import { validateAppManifest } from "@repo/contracts";
import { describe, expect, it } from "vitest";
import { appManifest } from "./manifest";

describe("${app.name} manifest", () => {
  it("is valid", () => {
    expect(validateAppManifest(appManifest).name).toBe("${app.name}");
  });
});
`,
  );
  write(
    `${appPath}/instrumentation.ts`,
    `
import { initializeTelemetry } from "@repo/telemetry";

export async function register() {
  initializeTelemetry({
    serviceName: "${app.serviceName}",
    version: "${packageVersion}",
    appName: "${app.name}",
    runtime: "cloudflare-workers"
  });
}
`,
  );
  write(`${appPath}/middleware.ts`, middlewareSource());
  write(`${appPath}/app/page.tsx`, appRootPage(app));
  write(`${appPath}/app/[locale]/layout.tsx`, layoutSource(app));
  write(
    `${appPath}/app/[locale]/error.tsx`,
    `
"use client";

import { ErrorState } from "@repo/ui";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="p-6">
      <ErrorState title="Something went wrong" description={error.message} action={{ label: "Retry", onClick: reset }} />
    </main>
  );
}
`,
  );
  write(
    `${appPath}/app/[locale]/loading.tsx`,
    `
import { LoadingState } from "@repo/ui";

export default function Loading() {
  return <LoadingState />;
}
`,
  );
  write(
    `${appPath}/app/[locale]/not-found.tsx`,
    `
import { ErrorState } from "@repo/ui";

export default function NotFound() {
  return (
    <main className="p-6">
      <ErrorState title="Page not found" description="The requested page does not exist." />
    </main>
  );
}
`,
  );
  for (const kind of ["live", "ready", "version"]) {
    write(`${appPath}/app/api/health/${kind}/route.ts`, healthRoute(kind));
    if (app.productPath) {
      write(
        `${appPath}/app/[locale]/${app.productPath}/api/health/${kind}/route.ts`,
        healthRoute(kind),
      );
    }
  }
  write(
    `${appPath}/open-next.config.ts`,
    `
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
`,
  );
  write(
    `${appPath}/wrangler.jsonc`,
    json({
      $schema: "../../node_modules/wrangler/config-schema.json",
      name: `juris-${app.name}`,
      main: ".open-next/worker.js",
      compatibility_date: "2026-05-23",
      compatibility_flags: ["nodejs_compat"],
      assets: {
        directory: ".open-next/assets",
        binding: "ASSETS",
      },
      observability: {
        enabled: true,
      },
    }),
  );
  write(
    `${appPath}/.env.example`,
    `
NEXT_PUBLIC_APP_ENV=local
NEXT_PUBLIC_PLATFORM_VERSION=${packageVersion}
NEXT_PUBLIC_ENABLE_REACT_SCAN=false
`,
  );
  write(
    `${appPath}/README.md`,
    `
# Juris ${app.displayName}

Independent frontend app for the ${app.displayName.toLowerCase()} capability.

## Run

\`\`\`bash
pnpm --filter @juris/${app.name} dev
\`\`\`

Local port: ${app.port}

## Health

- \`/api/health/live\`
- \`/api/health/ready\`
- \`/api/health/version\`
${app.productPath ? `- \`/en/${app.productPath}/api/health/live\`` : ""}

## Deploy

\`\`\`bash
pnpm --filter @juris/${app.name} build:cloudflare
pnpm --filter @juris/${app.name} deploy:cloudflare
\`\`\`
`,
  );
  if (app.name === "public") {
    write(`${appPath}/app/[locale]/page.tsx`, publicHomePage());
    write(
      `${appPath}/app/[locale]/about/page.tsx`,
      publicSubPage(
        "About Juris",
        "Juris gives platform teams a stable way to grow product surfaces without coupling every team to one deployable.",
      ),
    );
    write(
      `${appPath}/app/[locale]/pricing/page.tsx`,
      publicSubPage(
        "Pricing",
        "Mock plan content demonstrates a polished public experience without requiring a billing provider.",
      ),
    );
    write(
      `${appPath}/app/[locale]/security/page.tsx`,
      publicSubPage(
        "Security",
        "Security headers, app manifests, and typed boundaries are built into every app.",
      ),
    );
  } else if (app.name === "identity") {
    write(`${appPath}/src/components/login-actions.tsx`, loginActionsSource());
    for (const route of app.routes) {
      write(`${appPath}/app/[locale]/${route}/page.tsx`, identityPage(route));
    }
  } else {
    write(`${appPath}/src/mock-data.ts`, mockDataSource(app));
    write(
      `${appPath}/app/[locale]/page.tsx`,
      `
import { redirect } from "next/navigation";
import type { Locale } from "@repo/i18n";

export default async function LocaleIndex({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  redirect("/" + locale + "${app.basePath}");
}
`,
    );
    write(
      `${appPath}/app/[locale]/${app.productPath}/page.tsx`,
      productPage(app),
    );
    for (const route of app.routes) {
      write(
        `${appPath}/app/[locale]/${app.productPath}/${route}/page.tsx`,
        productPage(app, route),
      );
    }
  }
}

for (const app of appConfigs) {
  writeNextApp(app);
}

packageJson("apps/gateway", {
  name: "@juris/gateway",
  version: packageVersion,
  private: true,
  type: "module",
  scripts: {
    dev: "tsx src/dev-proxy.ts",
    build: "tsc -p tsconfig.json",
    lint: "eslint .",
    typecheck: "tsc --noEmit",
    test: "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    deploy: "wrangler deploy src/worker.ts",
    clean: "rm -rf dist coverage",
  },
  dependencies: {
    "@repo/contracts": "workspace:*",
    "@repo/platform": "workspace:*",
  },
  devDependencies: {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@types/node": "^24.10.1",
    "@vitest/coverage-v8": "4.1.7",
    tsx: "^4.21.0",
    typescript: "5.8.3",
    vitest: "4.1.7",
    wrangler: "^4.57.1",
  },
});

write(
  "apps/gateway/tsconfig.json",
  `
{
  "extends": "@repo/typescript-config/base",
  "compilerOptions": {
    "outDir": "dist",
    "noEmit": false
  },
  "include": ["src", "vitest.config.ts"],
  "exclude": ["node_modules", "dist"]
}
`,
);

write(
  "apps/gateway/eslint.config.mjs",
  `
import config from "@repo/eslint-config/library";

export default config;
`,
);

write(
  "apps/gateway/vitest.config.ts",
  `
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true
  }
});
`,
);

write(
  "apps/gateway/src/route-map.ts",
  `
export type GatewayRoute = {
  name: string;
  binding: "PUBLIC" | "IDENTITY" | "CONSOLE" | "ADMIN" | "BILLING" | "REPORTING" | "SETTINGS" | "SUPPORT";
  localOrigin: string;
  prefixes: string[];
};

export const routeMap: GatewayRoute[] = [
  { name: "identity", binding: "IDENTITY", localOrigin: "http://127.0.0.1:3002", prefixes: ["/en/login", "/sw/login", "/fr/login", "/en/logout", "/en/register", "/en/forgot-password", "/sw/logout", "/sw/register", "/sw/forgot-password", "/fr/logout", "/fr/register", "/fr/forgot-password"] },
  { name: "console", binding: "CONSOLE", localOrigin: "http://127.0.0.1:3003", prefixes: ["/en/console", "/sw/console", "/fr/console"] },
  { name: "admin", binding: "ADMIN", localOrigin: "http://127.0.0.1:3004", prefixes: ["/en/admin", "/sw/admin", "/fr/admin"] },
  { name: "billing", binding: "BILLING", localOrigin: "http://127.0.0.1:3005", prefixes: ["/en/billing", "/sw/billing", "/fr/billing"] },
  { name: "reporting", binding: "REPORTING", localOrigin: "http://127.0.0.1:3006", prefixes: ["/en/reports", "/sw/reports", "/fr/reports"] },
  { name: "settings", binding: "SETTINGS", localOrigin: "http://127.0.0.1:3007", prefixes: ["/en/settings", "/sw/settings", "/fr/settings"] },
  { name: "support", binding: "SUPPORT", localOrigin: "http://127.0.0.1:3008", prefixes: ["/en/support", "/sw/support", "/fr/support"] },
  { name: "public", binding: "PUBLIC", localOrigin: "http://127.0.0.1:3001", prefixes: ["/", "/en", "/sw", "/fr"] }
];

export function resolveRoute(pathname: string): GatewayRoute | undefined {
  const sortedRoutes = [...routeMap].sort(
    (left, right) => longestPrefix(right).length - longestPrefix(left).length
  );
  return sortedRoutes.find((route) =>
    route.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
  );
}

function longestPrefix(route: GatewayRoute): string {
  return route.prefixes.reduce((current, next) => (next.length > current.length ? next : current), "");
}
`,
);

write(
  "apps/gateway/src/dev-proxy.ts",
  `
import http from "node:http";
import net from "node:net";
import { URL } from "node:url";
import { resolveRoute } from "./route-map";

const port = 3000;

function json(res: http.ServerResponse, statusCode: number, body: unknown): void {
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function routeForRequest(pathname: string, referer?: string): ReturnType<typeof resolveRoute> {
  if (pathname.startsWith("/_next/") && referer) {
    return resolveRoute(new URL(referer).pathname) ?? resolveRoute("/");
  }

  return resolveRoute(pathname) ?? resolveRoute("/");
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:" + port);

  if (url.pathname === "/api/health/live") {
    json(res, 200, {
      status: "healthy",
      service: "juris-gateway",
      version: "${packageVersion}",
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (url.pathname === "/api/health/version") {
    json(res, 200, {
      name: "gateway",
      version: "${packageVersion}",
      gitSha: "local",
      buildTime: new Date().toISOString(),
      runtime: "cloudflare-workers"
    });
    return;
  }

  const referer = Array.isArray(req.headers.referer) ? req.headers.referer[0] : req.headers.referer;
  const route = routeForRequest(url.pathname, referer);

  if (!route) {
    json(res, 404, { success: false, error: { code: "route_not_found", message: "Route not found" } });
    return;
  }

  const upstream = new URL(req.url ?? "/", route.localOrigin);
  const proxyReq = http.request(
    upstream,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: upstream.host,
        "x-juris-gateway": "local"
      }
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (error) => {
    json(res, 502, {
      success: false,
      error: {
        code: "upstream_unavailable",
        message: "The " + route.name + " app is not reachable",
        details: error.message
      }
    });
  });

  req.pipe(proxyReq);
});

server.on("upgrade", (req, socket) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:" + port);
  const referer = Array.isArray(req.headers.referer) ? req.headers.referer[0] : req.headers.referer;
  const route = routeForRequest(url.pathname, referer);

  if (!route) {
    socket.destroy();
    return;
  }

  const upstream = new URL(route.localOrigin);
  const upstreamSocket = net.connect(Number(upstream.port), upstream.hostname, () => {
    socket.write(
      [
        req.method + " " + (req.url ?? "/") + " HTTP/" + req.httpVersion,
        ...Object.entries(req.headers).map(([key, value]) => key + ": " + value),
        "",
        ""
      ].join("\\r\\n")
    );
    upstreamSocket.pipe(socket);
    socket.pipe(upstreamSocket);
  });

  upstreamSocket.on("error", () => socket.destroy());
});

server.listen(port, () => {
  console.info("Juris gateway listening on http://127.0.0.1:" + port);
});
`,
);

write(
  "apps/gateway/src/worker.ts",
  `
import { resolveRoute, type GatewayRoute } from "./route-map";

type ServiceBinding = {
  fetch(request: Request): Promise<Response>;
};

type GatewayEnv = Partial<Record<GatewayRoute["binding"], ServiceBinding>> & {
  GIT_SHA?: string;
};

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {})
    }
  });
}

export default {
  async fetch(request: Request, env: GatewayEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health/live") {
      return json({
        status: "healthy",
        service: "juris-gateway",
        version: "${packageVersion}",
        timestamp: new Date().toISOString()
      });
    }

    if (url.pathname === "/api/health/version") {
      return json({
        name: "gateway",
        version: "${packageVersion}",
        gitSha: env.GIT_SHA ?? "local",
        buildTime: new Date().toISOString(),
        runtime: "cloudflare-workers"
      });
    }

    const route = resolveRoute(url.pathname);

    if (!route) {
      return json({ success: false, error: { code: "route_not_found", message: "Route not found" } }, { status: 404 });
    }

    const service = env[route.binding];

    if (service) {
      return service.fetch(request);
    }

    return json(
      {
        success: false,
        error: {
          code: "binding_missing",
          message: "No service binding is configured for " + route.name
        }
      },
      { status: 503 }
    );
  }
};
`,
);

write(
  "apps/gateway/src/route-map.test.ts",
  `
import { describe, expect, it } from "vitest";
import { resolveRoute } from "./route-map";

describe("gateway route map", () => {
  it("resolves product paths", () => {
    expect(resolveRoute("/en/console")?.name).toBe("console");
    expect(resolveRoute("/en/billing/invoices")?.name).toBe("billing");
    expect(resolveRoute("/en/login")?.name).toBe("identity");
    expect(resolveRoute("/en")?.name).toBe("public");
  });
});
`,
);

write(
  "apps/gateway/wrangler.toml",
  `
name = "juris-gateway"
main = "src/worker.ts"
compatibility_date = "2026-05-23"
compatibility_flags = ["nodejs_compat"]

[observability]
enabled = true
`,
);

write(
  "apps/gateway/README.md",
  `
# Juris Gateway

Cloudflare Worker-compatible routing layer for local composition and production service bindings.

## Local

\`\`\`bash
pnpm dev
\`\`\`

The gateway listens on port 3000 and proxies product paths to app ports 3001 through 3008.

## Production

Bind each independently deployed app worker to the gateway using the binding names in \`src/route-map.ts\`.
`,
);

write(
  "tooling/scripts/validate-i18n.ts",
  `
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function flatten(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nested]) => flatten(nested, prefix ? prefix + "." + key : key));
}

const messagesDir = join(process.cwd(), "packages/i18n/messages");
const files = readdirSync(messagesDir).filter((file) => file.endsWith(".json")).sort();
const [baseFile, ...restFiles] = files;

if (!baseFile) {
  throw new Error("No i18n message files found");
}

const baseKeys = new Set(flatten(JSON.parse(readFileSync(join(messagesDir, baseFile), "utf8"))));
const failures: string[] = [];

for (const file of restFiles) {
  const keys = new Set(flatten(JSON.parse(readFileSync(join(messagesDir, file), "utf8"))));
  for (const key of baseKeys) {
    if (!keys.has(key)) {
      failures.push(file + " is missing " + key);
    }
  }
  for (const key of keys) {
    if (!baseKeys.has(key)) {
      failures.push(file + " has extra key " + key);
    }
  }
}

if (failures.length > 0) {
  throw new Error("i18n validation failed:\\n" + failures.join("\\n"));
}

console.info("i18n validation passed for " + files.length + " locales");
`,
);

write(
  "tooling/scripts/validate-manifests.ts",
  `
import { readdirSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { validateAppManifest } from "@repo/contracts";

const appsDir = join(process.cwd(), "apps");
const appNames = readdirSync(appsDir).filter((name) => {
  const path = join(appsDir, name);
  return statSync(path).isDirectory() && name !== "gateway";
});

const manifests = await Promise.all(
  appNames.map(async (name) => {
    const moduleUrl = pathToFileURL(join(appsDir, name, "src/manifest.ts")).href;
    const mod = (await import(moduleUrl)) as { appManifest: unknown };
    return validateAppManifest(mod.appManifest);
  })
);

const names = new Set<string>();
const failures: string[] = [];

for (const manifest of manifests) {
  if (names.has(manifest.name)) {
    failures.push("Duplicate manifest name " + manifest.name);
  }
  names.add(manifest.name);
}

if (failures.length > 0) {
  throw new Error("manifest validation failed:\\n" + failures.join("\\n"));
}

console.info("manifest validation passed for " + manifests.length + " apps");
`,
);

write(
  "tooling/scripts/validate-architecture.ts",
  `
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";

const root = process.cwd();
const failures: string[] = [];
const ignoredDirs = new Set(["node_modules", ".next", ".open-next", "dist", "coverage", "storybook-static", ".turbo"]);
const importPattern = /(?:import|export)\\s+(?:type\\s+)?(?:[^'"\\n]+from\\s+)?["']([^"']+)["']|import\\(["']([^"']+)["']\\)/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    if (ignoredDirs.has(entry)) {
      return [];
    }
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      return walk(path);
    }
    if (/\\.(ts|tsx)$/.test(entry)) {
      return [path];
    }
    return [];
  });
}

function appNameFor(path: string): string | undefined {
  const parts = normalize(relative(root, path)).split(/[\\\\/]/);
  return parts[0] === "apps" ? parts[1] : undefined;
}

function resolveImport(file: string, specifier: string): string | undefined {
  if (specifier.startsWith(".")) {
    return normalize(resolve(dirname(file), specifier));
  }
  if (specifier.startsWith("apps/")) {
    return normalize(join(root, specifier));
  }
  return undefined;
}

for (const file of walk(root)) {
  const rel = normalize(relative(root, file));
  const source = readFileSync(file, "utf8");
  const currentApp = appNameFor(file);
  const isClient = /^["']use client["'];?/m.test(source);
  const isUiPackage = rel.startsWith("packages/ui/");
  const isContractsPackage = rel.startsWith("packages/contracts/");
  const isTokensPackage = rel.startsWith("packages/tokens/");

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2];
    if (!specifier) {
      continue;
    }

    const resolved = resolveImport(file, specifier);
    const targetApp = resolved ? appNameFor(resolved) : undefined;

    if (currentApp && targetApp && currentApp !== targetApp) {
      failures.push(rel + " imports from app " + targetApp + " via " + specifier);
    }

    if ((isUiPackage || isContractsPackage) && targetApp) {
      failures.push(rel + " imports app code via " + specifier);
    }

    if (isTokensPackage && !specifier.startsWith(".") && !specifier.startsWith("tailwindcss")) {
      failures.push(rel + " imports non-token dependency " + specifier);
    }

    if (isClient && (specifier.includes("server-only") || specifier.endsWith("/server") || specifier.includes("/server/"))) {
      failures.push(rel + " imports server-only module " + specifier);
    }
  }
}

if (failures.length > 0) {
  throw new Error("architecture validation failed:\\n" + failures.join("\\n"));
}

console.info("architecture validation passed");
`,
);

write(
  "README.md",
  `
# Juris Frontend Platform

Juris is a production-grade React microfrontend platform built with Next.js 15, React 19, TypeScript 5.8, Tailwind CSS, shadcn/ui-style Radix components, next-intl, Vitest, Playwright, Storybook, OpenTelemetry-ready helpers, and Cloudflare/OpenNext deployment scaffolding.

## Architecture

The repo uses pnpm workspaces and Turborepo. Product capabilities live in independent apps under \`apps/*\`; shared contracts, UI, auth, i18n, security, telemetry, platform helpers, and tooling live under \`packages/*\`.

Apps never import code from another app. Shared behavior belongs in packages and is enforced by \`pnpm validate:architecture\`.

## Apps

| App | Port | Route owner |
| --- | ---: | --- |
| gateway | 3000 | local routing and Cloudflare service binding entry |
| public | 3001 | \`/\`, \`/en\`, \`/sw\`, \`/fr\` |
| identity | 3002 | \`/[locale]/login\`, register, logout, forgot password |
| console | 3003 | \`/[locale]/console\` |
| admin | 3004 | \`/[locale]/admin\` |
| billing | 3005 | \`/[locale]/billing\` |
| reporting | 3006 | \`/[locale]/reports\` |
| settings | 3007 | \`/[locale]/settings\` |
| support | 3008 | \`/[locale]/support\` |

## Local Development

\`\`\`bash
corepack enable
pnpm install
pnpm dev
\`\`\`

Run one app:

\`\`\`bash
pnpm dev:console
pnpm dev:billing
\`\`\`

## Validation

\`\`\`bash
pnpm validate
\`\`\`

This runs typecheck, lint, format check, architecture checks, manifest checks, i18n checks, tests, and builds.

## Tests

\`\`\`bash
pnpm test
pnpm test:coverage
pnpm test:e2e
\`\`\`

## Storybook

\`\`\`bash
pnpm storybook
pnpm storybook:build
\`\`\`

## Cloudflare Deployment

Every Next app includes \`open-next.config.ts\` and \`wrangler.jsonc\`.

\`\`\`bash
pnpm --filter @juris/billing build:cloudflare
pnpm --filter @juris/billing deploy:cloudflare
\`\`\`

The gateway worker is service-binding-ready and maps product paths to independent app workers.

## Adding an App

Create a new app under \`apps/<capability>\`, add a typed manifest, health endpoints, locale-aware routes, a Cloudflare config, and root scripts. Put reusable code in packages before sharing it.

## Adding a Component

Add generic UI to \`packages/ui/src/components\`, export it from \`packages/ui/src/index.ts\`, add a story, and add focused tests when behavior is interactive.

## Enterprise Principles

- Independent deployability for every app.
- Build-time shared packages, no runtime coupling between apps.
- Health, manifest, loading, error, and fallback UI per app.
- Locale-aware routing for \`en\`, \`sw\`, and \`fr\`.
- Secure headers and CSP helper from \`@repo/security\`.
- OpenTelemetry-ready logging and event helpers.
- Degraded mode patterns for delayed data.
`,
);

const docs = {
  "docs/architecture.md": `
# Architecture

Juris is a path-routed microfrontend platform. Each app is a standalone Next.js deployment with its own config, tests, health endpoints, manifest, and Cloudflare scaffolding.

Shared code lives in packages:

- \`@repo/ui\` for enterprise components built on Radix and shadcn/ui conventions.
- \`@repo/contracts\` for Zod schemas and shared runtime contracts.
- \`@repo/i18n\` for locale config, messages, and formatting.
- \`@repo/security\` for headers, CSP, trusted origins, and policy helpers.
- \`@repo/platform\` for runtime, environment, cache, queue, storage, and health helpers.

The gateway owns routing infrastructure only. It contains no business UI.
`,
  "docs/routing.md": `
# Routing

Juris uses product paths:

- \`/[locale]\` -> public
- \`/[locale]/login\` -> identity
- \`/[locale]/console\` -> console
- \`/[locale]/admin\` -> admin
- \`/[locale]/billing\` -> billing
- \`/[locale]/reports\` -> reporting
- \`/[locale]/settings\` -> settings
- \`/[locale]/support\` -> support

Locales are \`en\`, \`sw\`, and \`fr\`. Each app can run directly on its own port, while the local gateway proxies cohesive paths from port 3000.
`,
  "docs/security.md": `
# Security

Security headers are generated by \`@repo/security\` and applied through middleware in every app.

Defaults include CSP, content type protection, referrer policy, permissions policy, cross-origin policies, and HSTS in production.

Local development allows the minimum extra script and connection sources required by Next.js development mode.
`,
  "docs/observability.md": `
# Observability

\`@repo/telemetry\` provides OpenTelemetry-ready setup, structured logging, request context, event tracking, and web vitals helpers.

Each app has \`instrumentation.ts\` and a manifest observability service name such as \`web-billing\`.
`,
  "docs/deployment-cloudflare.md": `
# Cloudflare Deployment

Each Next app uses OpenNext Cloudflare:

\`\`\`bash
pnpm --filter @juris/<app> build:cloudflare
pnpm --filter @juris/<app> preview:cloudflare
pnpm --filter @juris/<app> deploy:cloudflare
\`\`\`

The gateway is a Worker entry point. In production, bind each app Worker to the gateway using the binding names in \`apps/gateway/src/route-map.ts\`.

Preview environments should deploy app workers independently, then configure the gateway with matching service bindings. Rollback is done by rolling back the impacted app worker without requiring unrelated apps to redeploy.
`,
  "docs/adding-an-app.md": `
# Adding An App

1. Create \`apps/<capability>\`.
2. Add a Next.js app with locale routes under \`app/[locale]\`.
3. Add \`src/manifest.ts\` and validate it with \`@repo/contracts\`.
4. Add health routes.
5. Add \`next.config.ts\`, \`tailwind.config.ts\`, \`open-next.config.ts\`, and \`wrangler.jsonc\`.
6. Add root scripts if the app needs a dedicated convenience command.
7. Update the gateway route map.

Shared code belongs in packages.
`,
  "docs/design-system.md": `
# Design System

\`@repo/ui\` wraps shadcn/ui-style Radix primitives with Juris enterprise defaults.

The package exports core controls, shell navigation, states, status badges, metric cards, data table placeholders, tenant and user menus, theme controls, locale controls, and Storybook stories.
`,
  "docs/troubleshooting.md": `
# Troubleshooting

- If pnpm is missing, run \`corepack enable\`.
- If a gateway route returns 502, start the target app or run \`pnpm dev\`.
- If translations drift, run \`pnpm validate:i18n\`.
- If an app imports another app, run \`pnpm validate:architecture\` to locate the import.
`,
};

for (const [path, content] of Object.entries(docs)) {
  write(path, content);
}

console.info("Juris platform files generated");
