import * as vscode from 'vscode';
import type { AIProviderId } from '../../core/ai/types';

/**
 * Stores the AI provider credentials in the VS Code SecretStorage.
 *
 * The keys never leave the extension host: they are not written to the
 * workspace, the configuration, a log file or the webview. The webview only
 * ever learns *whether* a key exists.
 */
export class AISecretStorage {
  private static readonly PREFIX = 'daa.ai.key.';

  constructor(private readonly secrets: vscode.SecretStorage) {}

  /** Returns the API key of a provider, if one is stored. */
  async getApiKey(providerId: AIProviderId): Promise<string | undefined> {
    return this.secrets.get(AISecretStorage.keyFor(providerId));
  }

  /** Stores the API key of a provider. */
  async setApiKey(providerId: AIProviderId, apiKey: string): Promise<void> {
    await this.secrets.store(AISecretStorage.keyFor(providerId), apiKey);
  }

  /** Removes the API key of a provider. */
  async clearApiKey(providerId: AIProviderId): Promise<void> {
    await this.secrets.delete(AISecretStorage.keyFor(providerId));
  }

  /** Whether a key is stored — used for the status the webview may see. */
  async hasApiKey(providerId: AIProviderId): Promise<boolean> {
    const key = await this.secrets.get(AISecretStorage.keyFor(providerId));
    return typeof key === 'string' && key.length > 0;
  }

  private static keyFor(providerId: AIProviderId): string {
    return `${AISecretStorage.PREFIX}${providerId}`;
  }
}
