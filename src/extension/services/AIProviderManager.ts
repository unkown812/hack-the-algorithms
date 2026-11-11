import * as vscode from 'vscode';
import { ProviderRegistry } from '../../core/ai/AIProvider';
import type { AIProvider } from '../../core/ai/AIProvider';
import { OpenAIProvider } from '../../core/ai/providers/OpenAIProvider';
import { GeminiProvider } from '../../core/ai/providers/GeminiProvider';
import { LocalKnowledgeProvider } from '../../core/ai/providers/LocalKnowledgeProvider';
import { LocalLLMProvider } from '../../core/ai/providers/LocalLLMProvider';
import { AISecretStorage } from './AISecretStorage';
import { validateAIConfiguration } from '../../core/ai/AIConfiguration';
import { DEFAULT_AI_CONFIGURATION } from '../../core/ai/types';
import type {
  AIProviderConfig,
  AIProviderId,
  AIProviderStatus,
} from '../../core/ai/types';

/**
 * Owns the providers, the configuration and the credentials.
 *
 * It is the only place where a credential is read from the SecretStorage.
 * The configuration comes from the VS Code settings — the configuration
 * object never contains the key itself.
 */
export class AIProviderManager {
  private readonly registry = new ProviderRegistry();
  private readonly providers: AIProvider[];
  private readonly localLLM = new LocalLLMProvider();

  constructor(
    private readonly storage: AISecretStorage
  ) {
    this.providers = [
      new LocalKnowledgeProvider(),
      new OpenAIProvider(),
      new GeminiProvider(),
      this.localLLM,
    ];
    for (const provider of this.providers) {
      this.registry.register(provider);
    }
  }

  /** Reads the configuration from the VS Code settings. */
  getConfiguration(): AIProviderConfig {
    const settings = vscode.workspace.getConfiguration('daaCompanion.ai');
    return {
      provider: settings.get<AIProviderId>('provider', DEFAULT_AI_CONFIGURATION.provider),
      model: settings.get<string>('model', ''),
      temperature: settings.get<number>('temperature', DEFAULT_AI_CONFIGURATION.temperature),
      maxTokens: settings.get<number>('maxTokens', DEFAULT_AI_CONFIGURATION.maxTokens),
      timeoutMs: settings.get<number>('timeoutMs', DEFAULT_AI_CONFIGURATION.timeoutMs),
      maxContextMessages: settings.get<number>(
        'maxContextMessages',
        DEFAULT_AI_CONFIGURATION.maxContextMessages
      ),
      maxContextCharacters: settings.get<number>(
        'maxContextCharacters',
        DEFAULT_AI_CONFIGURATION.maxContextCharacters
      ),
      useLocalResources: settings.get<boolean>(
        'useLocalResources',
        DEFAULT_AI_CONFIGURATION.useLocalResources
      ),
      allowExternalContext: settings.get<boolean>(
        'allowExternalContext',
        DEFAULT_AI_CONFIGURATION.allowExternalContext
      ),
      streaming: settings.get<boolean>('streaming', DEFAULT_AI_CONFIGURATION.streaming),
      localBaseUrl: settings.get<string>(
        'localBaseUrl',
        DEFAULT_AI_CONFIGURATION.localBaseUrl
      ),
    };
  }

  /** Writes the configuration back into the VS Code settings. */
  async saveConfiguration(changes: Partial<AIProviderConfig>): Promise<AIProviderConfig> {
    const current = this.getConfiguration();
    const merged = { ...current, ...changes };
    const settings = vscode.workspace.getConfiguration('daaCompanion.ai');

    await settings.update('provider', merged.provider, vscode.ConfigurationTarget.Global);
    await settings.update('model', merged.model, vscode.ConfigurationTarget.Global);
    await settings.update('temperature', merged.temperature, vscode.ConfigurationTarget.Global);
    await settings.update('maxTokens', merged.maxTokens, vscode.ConfigurationTarget.Global);
    await settings.update('timeoutMs', merged.timeoutMs, vscode.ConfigurationTarget.Global);
    await settings.update(
      'maxContextMessages',
      merged.maxContextMessages,
      vscode.ConfigurationTarget.Global
    );
    await settings.update(
      'maxContextCharacters',
      merged.maxContextCharacters,
      vscode.ConfigurationTarget.Global
    );
    await settings.update(
      'useLocalResources',
      merged.useLocalResources,
      vscode.ConfigurationTarget.Global
    );
    await settings.update(
      'allowExternalContext',
      merged.allowExternalContext,
      vscode.ConfigurationTarget.Global
    );
    await settings.update('streaming', merged.streaming, vscode.ConfigurationTarget.Global);
    await settings.update('localBaseUrl', merged.localBaseUrl, vscode.ConfigurationTarget.Global);

    return merged;
  }

  /** The provider statuses for the settings view — never a credential. */
  async getStatuses(): Promise<AIProviderStatus[]> {
    const hasKey = async (id: AIProviderId): Promise<boolean> =>
      this.storage.hasApiKey(id);

    const config = this.getConfiguration();

    return Promise.all(
      this.registry.list().map(async (provider) => {
        const status = provider.getStatus(await hasKey(provider.id));

        if (provider.id === 'local-llm') {
          // The endpoint and the models of a running local server.
          status.endpoint = config.localBaseUrl;
          const models = await this.localLLM.listModels(config.localBaseUrl);
          if (models.length > 0) {
            status.models = models;
          }
        }

        return status;
      })
    );
  }

  /**
   * The resolver that the AIService uses.
   * It returns the provider together with its credential, so the key never
   * travels further than this call.
   */
  resolve = async (id: AIProviderId): Promise<{ provider: AIProvider; apiKey?: string } | undefined> => {
    const provider = this.registry.get(id);
    if (!provider) {
      return undefined;
    }
    const apiKey = provider.requiresKey
      ? await this.storage.getApiKey(id)
      : undefined;
    return { provider, apiKey };
  };

  /** Stores a credential. The key is passed from the webview once and never echoed back. */
  async setApiKey(providerId: AIProviderId, apiKey: string): Promise<void> {
    await this.storage.setApiKey(providerId, apiKey.trim());
  }

  /** Removes a credential. */
  async clearApiKey(providerId: AIProviderId): Promise<void> {
    await this.storage.clearApiKey(providerId);
  }

  /** The problems of the current configuration. */
  async validate(): Promise<Array<{ field: string; message: string }>> {
    return validateAIConfiguration(this.getConfiguration(), await this.hasKeyForSelected());
  }

  /** Sends a minimal test request to the configured provider. */
  async testProvider(): Promise<{ ok: boolean; message: string; provider: string }> {
    const config = this.getConfiguration();
    const access = await this.resolve(config.provider);

    if (!access) {
      return { ok: false, message: 'The selected provider is not registered.', provider: config.provider };
    }

    try {
      const response = await access.provider.send(
        {
          messages: [
            {
              id: 'test',
              role: 'user',
              content: 'Answer with the single word: connected.',
              createdAt: Date.now(),
            },
          ],
          systemPrompt: 'You are a connectivity test. Answer with one word.',
          context: [],
          mode: 'detailed',
          temperature: 0,
          maxTokens: 32,
        },
        config,
        access.apiKey
      );

      return {
        ok: true,
        message: `Connected to ${access.provider.name} (${response.model}).`,
        provider: config.provider,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'The provider could not be reached.';
      return { ok: false, message, provider: config.provider };
    }
  }

  private async hasKeyForSelected(): Promise<boolean> {
    const provider = this.getConfiguration().provider;
    const id = provider;
    if (!this.registry.get(id)?.requiresKey) {
      return true;
    }
    return this.storage.hasApiKey(id);
  }
}
