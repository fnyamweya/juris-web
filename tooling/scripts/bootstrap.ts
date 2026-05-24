import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type BlueprintKind = "app" | "package";

type CliOptions = {
  kind?: BlueprintKind;
  name?: string;
  displayName?: string;
  basePath?: string;
  owner?: string;
  port?: number;
  permission?: string;
  description?: string;
  dryRun: boolean;
  force: boolean;
  yes: boolean;
  registerRoute: boolean;
  registerScript: boolean;
};

type WritePlan = {
  filePath: string;
  content: string;
  mode?: "create" | "update";
};

const workspaceRoot = process.cwd();
const packageVersion = JSON.parse(
  await readFile(path.join(workspaceRoot, "package.json"), "utf8"),
) as { version: string };
const locales = ["en", "sw", "fr"] as const;
const appPorts = new Map([
  ["public", 3001],
  ["identity", 3002],
  ["console", 3003],
  ["admin", 3004],
  ["billing", 3005],
  ["reporting", 3006],
  ["settings", 3007],
  ["support", 3008],
]);

function printHelp() {
  console.log(`
Usage:
  pnpm bootstrap
  pnpm bootstrap app --name matters --display-name "Matters" --port 3009
  pnpm bootstrap package --name notifications --description "Notification utilities"

Options:
  --name <name>              Workspace-safe slug, e.g. matters
  --display-name <label>     Human label for app manifests and UI
  --base-path <path>         App route path, defaults to /<name>
  --owner <team>             Manifest owner, defaults to workspace-platform
  --port <port>              App dev port, defaults to first free app port
  --permission <permission>  App read permission, defaults to <name>:read
  --description <text>       Package description
  --dry-run                  Print the write plan without changing files
  --force                    Allow overwriting generated files
  --yes                      Skip confirmation prompts
  --no-route                 Do not register new apps in gateway route map
  --no-root-script           Do not add dev:<name> to the root package.json
  --help                     Show this help
`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    force: false,
    yes: false,
    registerRoute: true,
    registerScript: true,
  };
  const args = [...argv];

  const first = args[0];
  if (first === "app" || first === "package") {
    options.kind = first;
    args.shift();
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    switch (arg) {
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      case "--name":
        options.name = requireValue(arg, next);
        index += 1;
        break;
      case "--display-name":
        options.displayName = requireValue(arg, next);
        index += 1;
        break;
      case "--base-path":
        options.basePath = requireValue(arg, next);
        index += 1;
        break;
      case "--owner":
        options.owner = requireValue(arg, next);
        index += 1;
        break;
      case "--port":
        options.port = Number(requireValue(arg, next));
        index += 1;
        break;
      case "--permission":
        options.permission = requireValue(arg, next);
        index += 1;
        break;
      case "--description":
        options.description = requireValue(arg, next);
        index += 1;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--force":
        options.force = true;
        break;
      case "--yes":
      case "-y":
        options.yes = true;
        break;
      case "--no-route":
        options.registerRoute = false;
        break;
      case "--no-root-script":
        options.registerScript = false;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function requireValue(flag: string, value: string | undefined) {
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }

  return value;
}

async function promptForMissing(options: CliOptions): Promise<CliOptions> {
  if (options.yes && options.kind && options.name) {
    return options;
  }

  const rl = createInterface({ input, output });
  const ask = async (question: string, fallback?: string) => {
    const suffix = fallback ? ` (${fallback})` : "";
    const answer = await rl.question(`${question}${suffix}: `);
    return answer.trim() || fallback || "";
  };

  try {
    const kind =
      options.kind ??
      normalizeKind(
        await ask("What do you want to bootstrap? app/package", "app"),
      );
    const name = options.name ?? slugify(await ask("Name"));
    const displayName =
      options.displayName ??
      titleCase(await ask("Display name", titleCase(name)));

    return {
      ...options,
      kind,
      name,
      displayName,
      basePath:
        options.basePath ??
        (kind === "app"
          ? normalizeBasePath(await ask("Base path", `/${name}`))
          : undefined),
      owner:
        options.owner ??
        (kind === "app" ? await ask("Owner", "workspace-platform") : undefined),
      port:
        options.port ??
        (kind === "app"
          ? Number(await ask("Dev port", String(nextAvailablePort())))
          : undefined),
      permission:
        options.permission ??
        (kind === "app"
          ? await ask("Read permission", `${name}:read`)
          : undefined),
      description:
        options.description ??
        (kind === "package"
          ? await ask("Description", `${displayName} package`)
          : undefined),
    };
  } finally {
    rl.close();
  }
}

function normalizeKind(value: string): BlueprintKind {
  if (value !== "app" && value !== "package") {
    throw new Error("Kind must be app or package");
  }

  return value;
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
    throw new Error(
      "Name must start with a letter and contain only lowercase letters, numbers, and dashes",
    );
  }

  return slug;
}

function titleCase(value: string) {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function pascalCase(value: string) {
  return titleCase(value).replace(/\s+/g, "");
}

function normalizeBasePath(value: string) {
  const normalized = value.startsWith("/") ? value : `/${value}`;
  if (!/^\/[a-z0-9-]+$/.test(normalized)) {
    throw new Error("Base path must look like /matters");
  }

  return normalized;
}

function nextAvailablePort() {
  const used = new Set(appPorts.values());
  let port = 3001;
  while (used.has(port)) {
    port += 1;
  }
  return port;
}

function assertBlueprint(options: CliOptions): asserts options is CliOptions & {
  kind: BlueprintKind;
  name: string;
  displayName: string;
} {
  if (!options.kind) {
    throw new Error("Missing kind");
  }

  if (!options.name) {
    throw new Error("Missing name");
  }

  if (!options.displayName) {
    throw new Error("Missing display name");
  }

  slugify(options.name);

  if (options.kind === "app") {
    normalizeBasePath(options.basePath ?? `/${options.name}`);

    if (!Number.isInteger(options.port) || Number(options.port) < 1024) {
      throw new Error("App port must be an integer greater than 1024");
    }
  }
}

function file(
  filePath: string,
  content: string,
  mode: WritePlan["mode"] = "create",
): WritePlan {
  return {
    filePath: path.join(workspaceRoot, filePath),
    content: content.trimStart(),
    mode,
  };
}

async function createPackagePlan(
  options: CliOptions & { name: string; displayName: string },
) {
  const slug = slugify(options.name);
  const description = options.description ?? `${options.displayName} package`;
  const packageName = `@repo/${slug}`;

  return [
    file(
      `packages/${slug}/package.json`,
      JSON.stringify(
        {
          name: packageName,
          version: packageVersion.version,
          private: true,
          type: "module",
          exports: { ".": "./src/index.ts" },
          scripts: {
            build: "tsc --noEmit",
            lint: "eslint .",
            typecheck: "tsc --noEmit",
            test: "vitest run --passWithNoTests",
            "test:watch": "vitest --passWithNoTests",
            "test:coverage": "vitest run --coverage --passWithNoTests",
            clean: "rm -rf dist coverage",
          },
          devDependencies: {
            "@repo/eslint-config": "workspace:*",
            "@repo/typescript-config": "workspace:*",
            vitest: "4.1.7",
          },
        },
        null,
        2,
      ),
    ),
    file(
      `packages/${slug}/tsconfig.json`,
      `{
  "extends": "@repo/typescript-config/react-library",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src", "vitest.config.ts"],
  "exclude": ["node_modules", "dist"]
}
`,
    ),
    file(
      `packages/${slug}/eslint.config.mjs`,
      `import config from "@repo/eslint-config/library";

export default config;
`,
    ),
    file(
      `packages/${slug}/vitest.config.ts`,
      `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
  },
});
`,
    ),
    file(
      `packages/${slug}/src/index.ts`,
      `export const ${camelCase(slug)}Package = {
  name: "${packageName}",
  description: "${escapeString(description)}",
} as const;
`,
    ),
    file(
      `packages/${slug}/src/index.test.ts`,
      `import { describe, expect, it } from "vitest";
import { ${camelCase(slug)}Package } from "./index";

describe("${packageName}", () => {
  it("exposes package metadata", () => {
    expect(${camelCase(slug)}Package.name).toBe("${packageName}");
  });
});
`,
    ),
  ];
}

async function createAppPlan(
  options: CliOptions & { name: string; displayName: string },
) {
  const slug = slugify(options.name);
  const displayName = options.displayName;
  const owner = options.owner ?? "workspace-platform";
  const basePath = normalizeBasePath(options.basePath ?? `/${slug}`);
  const routeSegment = basePath.slice(1);
  const permission = options.permission ?? `${slug}:read`;
  const port = Number(options.port ?? nextAvailablePort());
  const packageName = `@juris/${slug}`;
  const manifestName = pascalCase(displayName);

  const plans: WritePlan[] = [
    file(
      `apps/${slug}/package.json`,
      JSON.stringify(
        {
          name: packageName,
          version: packageVersion.version,
          private: true,
          type: "module",
          scripts: {
            dev: `next dev --port ${port}`,
            build: "next build",
            "build:cloudflare": "opennextjs-cloudflare build",
            "preview:cloudflare": "opennextjs-cloudflare preview",
            "deploy:cloudflare": "opennextjs-cloudflare deploy",
            lint: "eslint .",
            typecheck: "tsc --noEmit",
            test: "vitest run",
            "test:watch": "vitest",
            "test:coverage": "vitest run --coverage",
            clean: "rm -rf .next .next-dev .open-next dist coverage",
          },
          dependencies: {
            "@next/bundle-analyzer": "15.5.18",
            "@opennextjs/cloudflare": "1.19.11",
            "@repo/access-control": "workspace:*",
            "@repo/auth": "workspace:*",
            "@repo/contracts": "workspace:*",
            "@repo/i18n": "workspace:*",
            "@repo/platform": "workspace:*",
            "@repo/security": "workspace:*",
            "@repo/telemetry": "workspace:*",
            "@repo/tokens": "workspace:*",
            "@repo/ui": "workspace:*",
            "lucide-react": "^0.468.0",
            next: "15.5.18",
            "next-intl": "4.12.0",
            "next-themes": "^0.4.6",
            react: "19.2.6",
            "react-dom": "19.2.6",
            zod: "^4.1.13",
          },
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
            eslint: "9.39.4",
            tailwindcss: "^3.4.18",
            typescript: "5.8.3",
            vitest: "4.1.7",
            wrangler: "^4.57.1",
          },
        },
        null,
        2,
      ),
    ),
    file(`apps/${slug}/next.config.ts`, nextConfigTemplate()),
    file(
      `apps/${slug}/open-next.config.ts`,
      `import { defineCloudflareConfig } from "@opennextjs/cloudflare";\n\nexport default defineCloudflareConfig();\n`,
    ),
    file(
      `apps/${slug}/postcss.config.mjs`,
      `export { default } from "../../postcss.config.mjs";\n`,
    ),
    file(`apps/${slug}/tailwind.config.ts`, tailwindTemplate()),
    file(
      `apps/${slug}/eslint.config.mjs`,
      `import config from "@repo/eslint-config/next";\n\nexport default config;\n`,
    ),
    file(`apps/${slug}/vitest.config.ts`, vitestTemplate()),
    file(
      `apps/${slug}/vitest.setup.ts`,
      `import "@testing-library/jest-dom/vitest";\n`,
    ),
    file(`apps/${slug}/tsconfig.json`, appTsconfigTemplate()),
    file(`apps/${slug}/i18n/request.ts`, i18nRequestTemplate()),
    file(`apps/${slug}/middleware.ts`, middlewareTemplate()),
    file(`apps/${slug}/app/layout.tsx`, rootLayoutTemplate()),
    file(
      `apps/${slug}/app/page.tsx`,
      `import { redirect } from "next/navigation";\n\nexport default function RootPage() {\n  redirect("/en${basePath}");\n}\n`,
    ),
    file(
      `apps/${slug}/app/[locale]/layout.tsx`,
      localeLayoutTemplate(displayName),
    ),
    file(
      `apps/${slug}/app/[locale]/page.tsx`,
      localeIndexTemplate(routeSegment),
    ),
    file(
      `apps/${slug}/app/[locale]/${routeSegment}/page.tsx`,
      appPageTemplate({ displayName, routeSegment, permission }),
    ),
    file(
      `apps/${slug}/src/manifest.ts`,
      manifestTemplate({ slug, displayName, basePath, owner, permission }),
    ),
    file(
      `apps/${slug}/src/manifest.test.ts`,
      manifestTestTemplate({ slug, manifestName }),
    ),
    file(`apps/${slug}/src/mock-data.ts`, mockDataTemplate()),
  ];

  for (const scope of ["app", `app/[locale]/${routeSegment}`]) {
    plans.push(
      file(
        `apps/${slug}/${scope}/api/health/live/route.ts`,
        healthRouteTemplate("createLiveHealthResponse"),
      ),
      file(
        `apps/${slug}/${scope}/api/health/ready/route.ts`,
        healthRouteTemplate("createReadyHealthResponse"),
      ),
      file(
        `apps/${slug}/${scope}/api/health/version/route.ts`,
        healthRouteTemplate("createVersionResponse"),
      ),
    );
  }

  if (options.registerRoute) {
    plans.push(await gatewayRoutePlan({ slug, basePath, port }));
  }

  if (options.registerScript) {
    plans.push(await rootPackageScriptPlan(slug));
  }

  return plans;
}

function camelCase(value: string) {
  const pascal = pascalCase(value);
  return pascal.slice(0, 1).toLowerCase() + pascal.slice(1);
}

function escapeString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function nextConfigTemplate() {
  return `import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  transpilePackages: [
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
  ],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
`;
}

function tailwindTemplate() {
  return `import { tailwindPreset } from "@repo/tokens/tailwind-preset";
import type { Config } from "tailwindcss";

export default {
  presets: [tailwindPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
} satisfies Config;
`;
}

function vitestTemplate() {
  return `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
  },
});
`;
}

function appTsconfigTemplate() {
  return `{
  "extends": "@repo/typescript-config/nextjs",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "noEmit": true,
    "esModuleInterop": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next-dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
`;
}

function i18nRequestTemplate() {
  return `import { defaultLocale, getMessages, isLocale } from "@repo/i18n";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : defaultLocale;

  return {
    locale,
    messages: await getMessages(locale),
  };
});
`;
}

function middlewareTemplate() {
  return `import { defaultLocale, isLocale } from "@repo/i18n";
import { getEnv } from "@repo/platform";
import {
  createNonce,
  CSP_NONCE_HEADER,
  getSecurityHeaders,
} from "@repo/security";
import { NextResponse, type NextRequest } from "next/server";

function withSecurityHeaders(
  response: NextResponse,
  nonce: string,
): NextResponse {
  const headers = getSecurityHeaders({
    environment:
      getEnv("NEXT_PUBLIC_APP_ENV") ?? getEnv("NODE_ENV") ?? "production",
    nonce,
    appName: "juris",
  });

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSP_NONCE_HEADER, nonce);

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return withSecurityHeaders(NextResponse.next(), nonce);
  }

  const locale = pathname.split("/")[1];

  if (!isLocale(locale)) {
    const url = request.nextUrl.clone();
    url.pathname = "/" + defaultLocale + (pathname === "/" ? "" : pathname);
    return withSecurityHeaders(NextResponse.redirect(url), nonce);
  }

  return withSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    nonce,
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
`;
}

function rootLayoutTemplate() {
  return `import "@repo/ui/styles.css";
import {
  getThemeClassName,
  THEME_COOKIE_NAME,
  ThemeScript,
} from "@repo/ui/theme";
import { CSP_NONCE_HEADER } from "@repo/security";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const theme = (await cookies()).get(THEME_COOKIE_NAME)?.value;
  const nonce = (await headers()).get(CSP_NONCE_HEADER) ?? undefined;

  return (
    <html
      lang="en"
      className={getThemeClassName(theme)}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript nonce={nonce} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
`;
}

function localeLayoutTemplate(displayName: string) {
  return `import { getDirection, getMessages, isLocale, locales } from "@repo/i18n";
import { CSP_NONCE_HEADER } from "@repo/security";
import { ThemeProvider, Toaster } from "@repo/ui";
import { NextIntlClientProvider } from "next-intl";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: "Juris ${escapeString(displayName)}",
  description: "Juris ${escapeString(displayName)} frontend",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);
  const nonce = (await headers()).get(CSP_NONCE_HEADER) ?? undefined;

  return (
    <div lang={locale} dir={getDirection(locale)}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeProvider nonce={nonce}>
          {children}
          <Toaster richColors closeButton />
        </ThemeProvider>
      </NextIntlClientProvider>
    </div>
  );
}
`;
}

function localeIndexTemplate(routeSegment: string) {
  return `import { redirect } from "next/navigation";
import type { Locale } from "@repo/i18n";

export default async function LocaleIndex({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect("/" + locale + "/${routeSegment}");
}
`;
}

function appPageTemplate({
  displayName,
  routeSegment,
  permission,
}: {
  displayName: string;
  routeSegment: string;
  permission: string;
}) {
  return `import type { Locale } from "@repo/i18n";
import { getMessages } from "@repo/i18n";
import { getMockSession } from "@repo/auth";
import {
  AppShell,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  platformNavIcons,
} from "@repo/ui";
import { PermissionGate } from "@repo/ui/permission-gate";
import { createTranslator } from "next-intl";
import { starterMetrics } from "@/mock-data";

function getNavItems(locale: string) {
  return [
    {
      label: "${escapeString(displayName)}",
      href: "/" + locale + "/${routeSegment}",
      icon: platformNavIcons.dashboard,
      permission: "${permission}",
    },
  ];
}

export default async function ${pascalCase(displayName)}Page({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages });
  const session = await getMockSession();

  return (
    <AppShell
      appName="${escapeString(displayName)}"
      navItems={getNavItems(locale)}
      user={session.user}
      tenant={session.currentTenant}
      tenants={session.availableTenants}
      locale={locale}
      session={session}
      breadcrumb={
        <Breadcrumb
          items={[
            { label: "Juris", href: "/" + locale },
            { label: "${escapeString(displayName)}" },
          ]}
        />
      }
    >
      <PermissionGate
        session={session}
        permission="${permission}"
        fallback={
          <EmptyState
            title="Access denied"
            description="Your mock session does not include this permission."
          />
        }
      >
        <PageHeader
          title="${escapeString(displayName)}"
          description="Enterprise-ready workspace generated by the Juris bootstrap CLI."
          actions={<Button variant="outline">{t("common.search")}</Button>}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {starterMetrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader>
                <CardTitle>{metric.title}</CardTitle>
                <CardDescription>{metric.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {metric.value}
              </CardContent>
            </Card>
          ))}
        </div>
      </PermissionGate>
    </AppShell>
  );
}
`;
}

function manifestTemplate({
  slug,
  displayName,
  basePath,
  owner,
  permission,
}: {
  slug: string;
  displayName: string;
  basePath: string;
  owner: string;
  permission: string;
}) {
  return `import {
  AppCriticality,
  AppRuntime,
  Locale,
  validateAppManifest,
} from "@repo/contracts";

export const appManifest = validateAppManifest({
  name: "${slug}",
  displayName: "${escapeString(displayName)}",
  basePath: "${basePath}",
  owner: "${escapeString(owner)}",
  version: "${packageVersion.version}",
  criticality: AppCriticality.Tier2,
  runtime: AppRuntime.CloudflareWorkers,
  requiredPlatformVersion: "^${packageVersion.version}",
  permissions: ["${permission}"],
  locales: [Locale.En, Locale.Sw, Locale.Fr],
  health: {
    live: "/api/health/live",
    ready: "/api/health/ready",
    version: "/api/health/version",
  },
  observability: {
    serviceName: "web-${slug}",
  },
});
`;
}

function manifestTestTemplate({
  slug,
  manifestName,
}: {
  slug: string;
  manifestName: string;
}) {
  return `import { validateAppManifest } from "@repo/contracts";
import { describe, expect, it } from "vitest";
import { appManifest } from "./manifest";

describe("${manifestName} manifest", () => {
  it("is valid", () => {
    expect(validateAppManifest(appManifest).name).toBe("${slug}");
  });
});
`;
}

function healthRouteTemplate(helper: string) {
  return `import { ${helper} } from "@repo/platform/health";
import { appManifest } from "@/manifest";

export const runtime = "edge";

export function GET() {
  return ${helper}(appManifest);
}
`;
}

function mockDataTemplate() {
  return `export const starterMetrics = [
  {
    title: "Readiness",
    description: "Bootstrap checks completed",
    value: "100%",
  },
  {
    title: "Runtime",
    description: "Cloudflare worker compatible",
    value: "Edge",
  },
  {
    title: "Security",
    description: "CSP, theme nonce, and health routes",
    value: "On",
  },
];
`;
}

async function gatewayRoutePlan({
  slug,
  basePath,
  port,
}: {
  slug: string;
  basePath: string;
  port: number;
}) {
  const routeMapPath = path.join(
    workspaceRoot,
    "apps/gateway/src/route-map.ts",
  );
  const source = await readFile(routeMapPath, "utf8");
  const binding = slug.toUpperCase().replace(/-/g, "_");

  if (source.includes(`name: "${slug}"`)) {
    return { filePath: routeMapPath, content: source, mode: "update" as const };
  }

  const withBinding = source.replace(
    '    | "SUPPORT";',
    `    | "SUPPORT"\n    | "${binding}";`,
  );
  const entry = `  {
    name: "${slug}",
    binding: "${binding}",
    localOrigin: "http://127.0.0.1:${port}",
    prefixes: ${JSON.stringify(locales.map((locale) => `/${locale}${basePath}`))},
  },
`;
  const content = withBinding.replace(
    '  {\n    name: "public",',
    `${entry}  {\n    name: "public",`,
  );

  return { filePath: routeMapPath, content, mode: "update" as const };
}

async function rootPackageScriptPlan(slug: string) {
  const packagePath = path.join(workspaceRoot, "package.json");
  const source = await readFile(packagePath, "utf8");
  const data = JSON.parse(source) as { scripts?: Record<string, string> };
  data.scripts ??= {};
  data.scripts[`dev:${slug}`] = `pnpm --filter @juris/${slug} dev`;

  return {
    filePath: packagePath,
    content: `${JSON.stringify(data, null, 2)}\n`,
    mode: "update" as const,
  };
}

async function applyPlan(plan: WritePlan[], options: CliOptions) {
  const writes = dedupePlan(plan);

  console.log("\nBootstrap plan");
  for (const item of writes) {
    const relative = path.relative(workspaceRoot, item.filePath);
    const exists = existsSync(item.filePath);
    const marker =
      item.mode === "update" ? "update" : exists ? "overwrite" : "create";
    console.log(`  ${marker.padEnd(9)} ${relative}`);

    if (exists && item.mode !== "update" && !options.force) {
      throw new Error(
        `${relative} already exists. Re-run with --force to overwrite.`,
      );
    }
  }

  if (options.dryRun) {
    console.log("\nDry run complete. No files changed.");
    return;
  }

  if (!options.yes) {
    const rl = createInterface({ input, output });
    const answer = await rl.question("\nApply this plan? yes/no: ");
    rl.close();

    if (answer.trim().toLowerCase() !== "yes") {
      console.log("Cancelled.");
      return;
    }
  }

  for (const item of writes) {
    await mkdir(path.dirname(item.filePath), { recursive: true });
    await writeFile(item.filePath, item.content);
  }

  console.log(
    `\nApplied ${writes.length} file operation${writes.length === 1 ? "" : "s"}.`,
  );
}

function dedupePlan(plan: WritePlan[]) {
  const byPath = new Map<string, WritePlan>();

  for (const item of plan) {
    byPath.set(item.filePath, item);
  }

  return [...byPath.values()];
}

async function main() {
  const options = await promptForMissing(parseArgs(process.argv.slice(2)));
  assertBlueprint(options);

  const plan =
    options.kind === "app"
      ? await createAppPlan(options)
      : await createPackagePlan(options);

  await applyPlan(plan, options);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
