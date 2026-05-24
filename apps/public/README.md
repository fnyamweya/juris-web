# Juris Public

Independent frontend app for the public capability.

## Run

```bash
pnpm --filter @juris/public dev
```

Local port: 3001

## Health

- `/api/health/live`
- `/api/health/ready`
- `/api/health/version`

## Deploy

```bash
pnpm --filter @juris/public build:cloudflare
pnpm --filter @juris/public deploy:cloudflare
```
