# Juris Console

Independent frontend app for the console capability.

## Run

```bash
pnpm --filter @juris/console dev
```

Local port: 3003

## Health

- `/api/health/live`
- `/api/health/ready`
- `/api/health/version`
- `/en/console/api/health/live`

## Deploy

```bash
pnpm --filter @juris/console build:cloudflare
pnpm --filter @juris/console deploy:cloudflare
```
