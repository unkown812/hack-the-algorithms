# DAA Learning Companion — Release Guide

## Versioning

- Extension version is maintained in `package.json` and mirrored in `package-lock.json`.
- Releases are documented in `CHANGELOG.md`.

## Release stages

| Stage | Purpose | Exit criteria |
|---|---|---|
| Alpha | Internal validation of critical workflows | Audit findings remediated, P0 gate passed |
| Beta | Real-world student feedback | Onboarding, deep links, theme fixed; feedback collection |
| Stable 1.0 | Public release | Acceptance criteria met, VSIX packaged and validated |

## Release checklist

1. `npm run check-types`
2. `npm run lint`
3. `npm run compile`
4. `npm test`
5. `npx vsce package`
6. Install the generated VSIX in a clean VS Code instance and verify activation.
7. Run marketplace validation (`vsce package` reports missing metadata).
8. Publish through the configured publisher account (`vsce publish`).

## CI/CD

- `.github/workflows/ci.yml` runs install, type check, lint, compile, unit tests on push/PR.
- Further workflows (`test.yml`, `release.yml`) are planned for the Phase 8 QA/CI pillar.
