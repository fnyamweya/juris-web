# Juris Support

Independent frontend app for the support capability.

## Run

```bash
pnpm --filter @juris/support dev
```

Local port: 3008

## Health

- `/api/health/live`
- `/api/health/ready`
- `/api/health/version`
- `/en/support/api/health/live`

## Deploy

```bash
pnpm --filter @juris/support build:cloudflare
pnpm --filter @juris/support deploy:cloudflare
```
