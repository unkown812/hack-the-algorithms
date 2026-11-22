import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { registerProviders } from './providers';

export function activate(context: vscode.ExtensionContext): void {
  console.log('DAA Learning Companion is now active!');

  registerCommands(context);
  registerProviders(context);
}

export function deactivate(): void {
  // No cleanup required for Phase 1
}
