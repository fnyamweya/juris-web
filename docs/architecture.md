# Architecture

Juris is a path-routed microfrontend platform. Each app is a standalone Next.js deployment with its own config, tests, health endpoints, manifest, and Cloudflare scaffolding.

Shared code lives in packages:

- `@repo/ui` for enterprise components built on Radix and shadcn/ui conventions.
- `@repo/contracts` for Zod schemas and shared runtime contracts.
- `@repo/i18n` for locale config, messages, and formatting.
- `@repo/security` for headers, CSP, trusted origins, and policy helpers.
- `@repo/platform` for runtime, environment, cache, queue, storage, and health helpers.

The gateway owns routing infrastructure only. It contains no business UI.
