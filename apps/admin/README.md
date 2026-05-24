# Juris Admin

Independent frontend app for the admin capability.

## Run

```bash
pnpm --filter @juris/admin dev
```

Local port: 3004

## Health

- `/api/health/live`
- `/api/health/ready`
- `/api/health/version`
- `/en/admin/api/health/live`

## Deploy

```bash
pnpm --filter @juris/admin build:cloudflare
pnpm --filter @juris/admin deploy:cloudflare
```
