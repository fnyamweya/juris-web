# Juris Frontend Platform

Juris is a production-grade React microfrontend platform built with Next.js 15, React 19, TypeScript 5.8, Tailwind CSS, shadcn/ui-style Radix components, next-intl, Vitest, Playwright, Storybook, OpenTelemetry-ready helpers, and Cloudflare/OpenNext deployment scaffolding.

## Architecture

The repo uses pnpm workspaces and Turborepo. Product capabilities live in independent apps under `apps/*`; shared contracts, UI, auth, i18n, security, telemetry, platform helpers, and tooling live under `packages/*`.

Apps never import code from another app. Shared behavior belongs in packages and is enforced by `pnpm validate:architecture`.

## Apps

| App       | Port | Route owner                                          |
| --------- | ---: | ---------------------------------------------------- |
| gateway   | 3000 | local routing and Cloudflare service binding entry   |
| public    | 3001 | `/`, `/en`, `/sw`, `/fr`                             |
| identity  | 3002 | `/[locale]/login`, register, logout, forgot password |
| console   | 3003 | `/[locale]/console`                                  |
| admin     | 3004 | `/[locale]/admin`                                    |
| billing   | 3005 | `/[locale]/billing`                                  |
| reporting | 3006 | `/[locale]/reports`                                  |
| settings  | 3007 | `/[locale]/settings`                                 |
| support   | 3008 | `/[locale]/support`                                  |
| docs      | 3009 | `/[locale]/docs`                                     |

## Local Development

```bash
corepack enable
pnpm install
pnpm dev:check
pnpm dev
```

Run one app:

```bash
pnpm dev:console
pnpm dev:billing
```

If `pnpm dev` fails immediately, one of the local ports is already occupied. Re-run `pnpm dev:check` to see which service ports need to be freed. You can bypass the preflight once with `SKIP_DEV_PORT_CHECK=1 pnpm dev`.

## Validation

```bash
pnpm validate
pnpm codehawk
```

This runs typecheck, lint, format check, architecture checks, manifest checks, i18n checks, tests, and builds.
`pnpm codehawk` is a CI-ready placeholder for the organization code analysis CLI.

## Tests

```bash
pnpm test
pnpm test:coverage
pnpm test:e2e
```

## Storybook

```bash
pnpm storybook
pnpm storybook:build
```

## Cloudflare Deployment

Every deployable app is discovered programmatically from the monorepo and deployed through generated Wrangler configs. GitHub Actions provisions isolated Cloudflare Workers per environment using only:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

```bash
pnpm cloudflare:validate
pnpm cloudflare:deploy -- --environment staging --app billing
pnpm cloudflare:destroy -- --environment preview --scope pr-42
```

GitHub environments are structured as:

- `preview`: deployed automatically for pull requests as isolated `pr-<number>` workers
- `staging`: deployed manually with the staging workflow
- `production`: deployed automatically from published GitHub releases

Pull requests and production releases now use affected-app deployment planning so app changes only redeploy the workers they actually impact. After deployment, GitHub Actions runs Cloudflare smoke tests against direct worker health endpoints and the gateway entry point. Preview gateway bindings are merged with already-provisioned preview workers so redeploying app A does not silently disconnect app B.

## Release Management

Semantic versioning is managed with Changesets in fixed-version mode so the whole platform moves together. Contributors add release intent with:

```bash
pnpm changeset
```

On `main`, GitHub Actions opens a release PR that bumps workspace versions, refreshes changelogs, updates the root `CHANGELOG.md`, and publishes a GitHub release. Production deployment then runs from that release event.

## Adding an App

Create a new app under `apps/<capability>`, add a typed manifest, health endpoints, locale-aware routes, a Cloudflare config, and root scripts. Put reusable code in packages before sharing it.

## Adding a Component

Add generic UI to `packages/ui/src/components`, export it from `packages/ui/src/index.ts`, add a story, and add focused tests when behavior is interactive.

## Enterprise Principles

- Independent deployability for every app.
- Build-time shared packages, no runtime coupling between apps.
- Health, manifest, loading, error, and fallback UI per app.
- Locale-aware routing for `en`, `sw`, and `fr`.
- Secure headers and CSP helper from `@repo/security`.
- OpenTelemetry-ready logging and event helpers.
- Degraded mode patterns for delayed data.
