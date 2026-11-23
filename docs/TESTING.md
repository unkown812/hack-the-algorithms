# DAA Learning Companion — Testing Guide

## Automated test layers

- **Unit tests** — `tests/unit/**` (Vitest). Covers algorithms, visualization, complexity, compiler/execution, debugging, practice, assessments, AI, persistence.
- **Extension tests** — `test/**` (VS Code Test Runner); currently a scaffold only.
- **End-to-end tests** — not yet automated beyond the playground "e2e" unit scenario; browser-level E2E is planned.

## Commands

- `npm run check-types` — TypeScript validation.
- `npm run lint` — ESLint.
- `npm run compile` — esbuild production build.
- `npm test` — Vitest unit suite.

## Conventions

- AI provider tests use mocked providers; no paid API calls in CI.
- Real-GDB test runs on Linux/macOS/Windows via the platform toolchain and skips when unavailable.
- Educational assertions never fabricate results; they use deterministic engines.

## Coverage expectations

Phase 8 targets expanding coverage with integration, E2E and cross-platform CI before the stable release.
