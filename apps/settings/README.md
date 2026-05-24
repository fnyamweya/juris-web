# Juris Settings

Independent frontend app for the settings capability.

## Run

```bash
pnpm --filter @juris/settings dev
```

Local port: 3007

## Health

- `/api/health/live`
- `/api/health/ready`
- `/api/health/version`
- `/en/settings/api/health/live`

## Deploy

```bash
pnpm --filter @juris/settings build:cloudflare
pnpm --filter @juris/settings deploy:cloudflare
```
