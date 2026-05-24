# Juris Billing

Independent frontend app for the billing capability.

## Run

```bash
pnpm --filter @juris/billing dev
```

Local port: 3005

## Health

- `/api/health/live`
- `/api/health/ready`
- `/api/health/version`
- `/en/billing/api/health/live`

## Deploy

```bash
pnpm --filter @juris/billing build:cloudflare
pnpm --filter @juris/billing deploy:cloudflare
```
