# Adding An App

1. Create `apps/<capability>`.
2. Add a Next.js app with locale routes under `app/[locale]`.
3. Add `src/manifest.ts` and validate it with `@repo/contracts`.
4. Add health routes.
5. Add `next.config.ts`, `tailwind.config.ts`, `open-next.config.ts`, and `wrangler.jsonc`.
6. Add root scripts if the app needs a dedicated convenience command.
7. Update the gateway route map.

Shared code belongs in packages.
