# DAA Learning Companion — Security and Privacy

## Code execution

- User programs are compiled and executed locally with the user's own privileges.
- Execution is capped by a configurable timeout, with child-process termination.
- Output is limited by configured byte caps.
- Temporary artifacts are managed by the process manager.
- Never run untrusted code with elevated privileges; OS-level sandboxing is the
  responsibility of the host operating system.

## AI security

- API keys live in VS Code SecretStorage; they are never sent to the webview and are
  never logged.
- User-selected context (source code, execution results, diagnostics, progress) leaves
  the machine only with explicit consent for external providers.
- The local provider and local model server never leave the machine.
- The AI does not execute code from retrieved content; it answers from retrieved context.

## Extension security

- Webview Content Security Policy: `default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'nonce-…'; img-src 'self' data:`.
- Per-load random nonce for the webview script.
- Local resource roots restricted to `dist/`, `media/`, `resources/`.

## Known limitations

- Execution timeouts are not a complete process sandbox.
- AI answers are generated content, not measured results.
