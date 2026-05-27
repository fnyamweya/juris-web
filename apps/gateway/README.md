# Juris Gateway

Cloudflare Worker-compatible routing layer for local composition and production service bindings.

## Local

```bash
pnpm dev:check
pnpm dev
```

The gateway listens on port 3000 by default and proxies product paths to app ports 3001 through 3009. Override the gateway listener with `GATEWAY_PORT=<port>` when you need to run it on a different local port.

## Production

Bind each independently deployed app worker to the gateway using the binding names in `src/route-map.ts`.
