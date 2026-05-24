# Troubleshooting

- If pnpm is missing, run `corepack enable`.
- If a gateway route returns 502, start the target app or run `pnpm dev`.
- If translations drift, run `pnpm validate:i18n`.
- If an app imports another app, run `pnpm validate:architecture` to locate the import.
