# DAA Learning Companion — Troubleshooting Guide

## Compiler and execution

### The compiler is not detected

- The playground detects GCC on Windows (MSYS2, MinGW-w64, TDM, Strawberry, Xcode CLT),
  macOS (Xcode CLT) and Linux (build-essential).
- Install a GCC toolchain and restart VS Code; the status is shown in the playground.
- Run **DAA Companion: Refresh Compiler Status** if the status is stale.

### Compilation errors

- The diagnostic panel explains compiler messages in plain language and links the
  offending source line.
- Test-case execution stops on compile errors; runtime errors are reported per test.

### Debugger does not start

- Debugging requires the local GDB installation and a compiled program.
- Start from the playground debug controls; never run untrusted code with elevated privileges.

### Output is truncated

- Execution output is capped by the configured limit; increase the limit if needed.

## AI Assistant

### No AI provider configured

- The assistant runs offline with the bundled learning resources.
- To use OpenAI/Gemini/local LLM: configure the provider in the assistant settings and
  store the key in VS Code SecretStorage.

### The answer ignores my context

- Context is attached through the context panel; it is withheld from external
  providers without consent and shortened over the context budget.

## Practice and quizzes

- Quizzes need approved questions from the question bank.
- Generated questions are drafts and must be approved.

## General

- If the webview shows stale content, reload the window (`Developer: Reload Window`).
- If the extension fails to activate, check the `DAA Companion` output channel and
  reinstall/update the extension.

## Known limitations

- Execution timeouts are not a security sandbox.
- AI answers are generated, not measured.
- Offline AI is retrieval-based.
