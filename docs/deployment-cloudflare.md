# Cloudflare Deployment

Cloudflare deployment is driven by the repository automation rather than hand-maintained per-environment Wrangler files.

## Required GitHub Secrets

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Those two secrets are enough for CI because worker resources are provisioned by the deploy step itself.

## Environment Model

- `preview`: one isolated worker set per pull request using the scope `pr-<number>`
- `staging`: a shared non-production environment deployed on demand
- `production`: the canonical release environment, deployed from GitHub releases

The deploy scripts generate temporary Wrangler configs with environment-specific worker names, release metadata vars, and gateway service bindings that target the matching worker set.

## Deployment Selection

- `preview`: computes the affected apps from the pull request diff and deploys only those workers
- `staging`: defaults to a full environment deploy, but supports targeted redeploys through the `apps` workflow input
- `production`: compares the published release tag against the previous release tag and deploys only the affected workers unless it is the first release

Shared runtime package changes fan out only to the apps that depend on them. Deployment workflow or Cloudflare automation changes promote to a full environment deploy on purpose.

## Isolation Guarantees

- App workers are deployed independently through the generated matrix, so app A does not trigger an app B worker deploy unless a shared runtime dependency changed.
- In preview, the gateway is refreshed whenever preview app bindings need to change.
- Preview gateway bindings are merged with the already-provisioned preview worker set, which keeps unaffected app routes live across partial redeploys.
- In staging and production, gateway redeploys are skipped for app-only worker releases because the service binding names stay stable.

## Smoke Tests

After deployment, the reusable Cloudflare workflow runs smoke tests that verify:

- direct worker `/api/health/live`
- direct worker `/api/health/version`
- gateway `/api/health/live` and `/api/health/version` when the gateway was part of the deployment
- gateway-routed app paths for the deployed apps

## Local Commands

```bash
pnpm cloudflare:validate
pnpm cloudflare:plan -- --environment preview --base-ref origin/main --head-ref HEAD --mode affected
pnpm cloudflare:matrix -- --group app-workers
pnpm cloudflare:deploy -- --environment preview --scope pr-42 --app public
pnpm cloudflare:smoke -- --environment preview --scope pr-42 --apps public --expect-gateway --expect-gateway-routes
pnpm cloudflare:deploy -- --environment staging
pnpm cloudflare:destroy -- --environment preview --scope pr-42
```

## GitHub Workflows

- `ci.yml`: validates formatting, linting, type safety, architecture rules, manifests, i18n rules, unit tests, builds, and end-to-end tests
- `release-pr.yml`: creates and updates the release PR from pending changesets
- `publish-release.yml`: creates a GitHub release from the latest root changelog entry
- `deploy-preview.yml`: provisions per-PR preview workers for affected apps, refreshes preview gateway bindings, and runs smoke tests
- `deploy-staging.yml`: manually deploys staging, optionally narrowed to a comma-separated app list
- `deploy-production.yml`: deploys affected production workers from a published GitHub release and runs smoke tests
- `cleanup-preview.yml`: tears preview workers down when a pull request closes

## Service Bindings

The gateway remains the Worker entry point. Its bindings are derived from `apps/gateway/src/route-map.ts`, so adding a new deployable app only requires:

1. Adding the app to `apps/*`
2. Giving it Cloudflare deploy scripts and `open-next.config.ts`
3. Registering its route in `apps/gateway/src/route-map.ts`

The deployment manifest and workflow matrix update automatically from there.
