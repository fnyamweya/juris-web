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

## Local Commands

```bash
pnpm cloudflare:validate
pnpm cloudflare:matrix -- --group app-workers
pnpm cloudflare:deploy -- --environment preview --scope pr-42 --app public
pnpm cloudflare:deploy -- --environment staging
pnpm cloudflare:destroy -- --environment preview --scope pr-42
```

## GitHub Workflows

- `ci.yml`: validates formatting, linting, type safety, architecture rules, manifests, i18n rules, unit tests, builds, and end-to-end tests
- `release-pr.yml`: creates and updates the release PR from pending changesets
- `publish-release.yml`: creates a GitHub release from the latest root changelog entry
- `deploy-preview.yml`: provisions per-PR preview workers and deploys the gateway after the app workers
- `deploy-staging.yml`: manually deploys the staging environment
- `deploy-production.yml`: deploys production from a published GitHub release
- `cleanup-preview.yml`: tears preview workers down when a pull request closes

## Service Bindings

The gateway remains the Worker entry point. Its bindings are derived from `apps/gateway/src/route-map.ts`, so adding a new deployable app only requires:

1. Adding the app to `apps/*`
2. Giving it Cloudflare deploy scripts and `open-next.config.ts`
3. Registering its route in `apps/gateway/src/route-map.ts`

The deployment manifest and workflow matrix update automatically from there.
