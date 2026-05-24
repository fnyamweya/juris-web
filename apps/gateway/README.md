# Juris Gateway

Cloudflare Worker-compatible routing layer for local composition and production service bindings.

## Local

```bash
pnpm dev
```

The gateway listens on port 3000 and proxies product paths to app ports 3001 through 3008.

## Production

Bind each independently deployed app worker to the gateway using the binding names in `src/route-map.ts`.
