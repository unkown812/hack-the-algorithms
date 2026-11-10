# Development Guide

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Compile the extension: `npm run compile`
4. Open in VS Code: Press `F5` to launch Extension Development Host
5. Run the command: `DAA Companion: Open Dashboard` from the Command Palette

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run compile` | Bundle extension and webview with esbuild |
| `npm run watch` | Watch mode for development |
| `npm run check-types` | TypeScript type checking |
| `npm run lint` | ESLint on source files |
| `npm test` | Run unit tests with Vitest |
| `npm run package` | Package extension as .vsix |

## Project Structure

```
src/
  extension/     - VS Code extension host logic
  webview/       - React webview application
  core/          - Algorithm engine (registry, complexity, execution, visualization)
    complexity/  - Phase 4 complexity analysis (counters, benchmarking, comparison, reports)
  shared/        - Shared types, constants, utilities
tests/
  unit/          - Vitest unit tests
  integration/   - VS Code extension integration tests
resources/
  algorithms/    - Algorithm markdown resources
  practicals/    - C practical source files
docs/            - Project documentation
```

## Adding a New Algorithm

1. Create algorithm data in `src/core/algorithms/<category>/<algorithm>.ts`
2. Export it from the category index
3. Register it in `src/core/algorithms/registry.ts`
4. Add markdown resource in `resources/algorithms/<category>/<algorithm>.md`
5. Add unit tests in `tests/unit/`

## Adding an Algorithm to the Complexity Analyzer (Phase 4)

1. Add the reviewed C implementation in `src/core/code-data/<algorithm>.c`
2. Add an instrumented mirror in `src/core/complexity/counters/engine/<category>/<algorithm>.ts`
   — the counters must be incremented in the algorithm's own statements, never
   estimated from Big-O
3. Document the counting convention in
   `src/core/complexity/counters/engine/CountingConventions.ts`
4. Wire the algorithm into `runInstrumentedInput`
   (`src/core/complexity/counters/engine/index.ts`) and validate its output
5. Add the input limit in `src/core/complexity/benchmarking/BenchmarkConfig.ts`
6. Add exact counter assertions in `tests/unit/complexity/counters.test.ts`

## Working on the Code Playground (Phase 5)

The playground splits into two halves — never mix them:

- **Extension host** (`src/core/compiler`, `src/core/execution`,
  `src/core/debugging`, `src/core/tracing`, `src/core/testing`,
  `src/core/playground`): everything that touches a process, a compiler, a
  debugger or the file system.
- **Webview** (`src/webview/components/playground`,
  `src/webview/components/debugging`, `src/webview/components/execution`,
  `src/webview/components/testing`): rendering only. Webview files may import
  **types** from `src/core/playground/types`, but never a module that pulls in
  `node:*` or `vscode`.

Every new host capability needs a message in `PLAYGROUND_MESSAGES`
(`src/shared/constants/index.ts`), a case in
`src/extension/playground/message-handler.ts` and a handler in the webview
page.

### Local toolchain

The compiler and debugger tests use the real toolchain when one is installed
and are skipped otherwise:

```bash
gcc --version   # required for the compiler and execution tests
gdb --version   # required for the debugger tests
```

## Publishing

1. Update `version` in `package.json`
2. Run `npm run package` to create `.vsix`
3. Publish to VS Code Marketplace using `vsce publish`
