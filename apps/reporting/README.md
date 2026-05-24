# Juris Reporting

Independent frontend app for the reporting capability.

## Run

```bash
pnpm --filter @juris/reporting dev
```

Local port: 3006

## Health

- `/api/health/live`
- `/api/health/ready`
- `/api/health/version`
- `/en/reports/api/health/live`

## Deploy

```bash
pnpm --filter @juris/reporting build:cloudflare
pnpm --filter @juris/reporting deploy:cloudflare
```
