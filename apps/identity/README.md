# Juris Identity

Independent frontend app for the identity capability.

## Run

```bash
pnpm --filter @juris/identity dev
```

Local port: 3002

## Health

- `/api/health/live`
- `/api/health/ready`
- `/api/health/version`

## Deploy

```bash
pnpm --filter @juris/identity build:cloudflare
pnpm --filter @juris/identity deploy:cloudflare
```
