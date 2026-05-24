# Observability

`@repo/telemetry` provides OpenTelemetry-ready setup, structured logging, request context, event tracking, and web vitals helpers.

Each app has `instrumentation.ts` and a manifest observability service name such as `web-billing`.

`pnpm codehawk` is provided as a placeholder integration point for CI code analysis. Set `CODEHAWK_ENABLED=true` when wiring the organization vendor CLI.
