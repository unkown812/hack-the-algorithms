# DAA Learning Companion — Installation Guide

## Requirements

- Visual Studio Code `^1.85.0` or newer.
- Node.js 18+ for development builds (bundled by the extension host).
- GCC toolchain for the Code Playground and debugger (optional for the rest of the extension).

## Install from the Marketplace

1. Open the VS Code Extensions view.
2. Search for **DAA Learning Companion**.
3. Install the published version.

## Install from a VSIX

1. Build the package: `npm run package` (requires `@vscode/vsce`).
2. Install the generated `.vsix` through the Extensions view or the command
   `Extensions: Install from VSIX…`.

## First run

1. Open the dashboard via the Activity Bar or the command palette.
2. Use the onboarding entry point or the dashboard quick actions.
3. Configure the compiler when using the playground (GCC detection runs automatically).

## Optional configuration

- AI provider: `daaCompanion.ai.provider` (`local`, `local-llm`, `openai`, `gemini`), model, temperature, token limit, timeout, context budget, streaming, local base URL.
- Keys: stored in VS Code SecretStorage only.

See the README and the assistant settings for the full option list.

## Uninstall / upgrade

- Uninstall through the Extensions view; user data (global state) is kept by VS Code
  unless you reset it in the practice/progress screens.

## Troubleshooting

See [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md).
