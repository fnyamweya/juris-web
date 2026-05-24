# Changesets

Every release-relevant pull request should include a changeset file:

```bash
pnpm changeset
```

The repository uses a fixed-version release train, so every app and shared package moves together under one semantic version. Release pull requests are generated automatically from the pending changesets, along with workspace changelogs and the root `CHANGELOG.md`.
