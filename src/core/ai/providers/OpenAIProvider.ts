import { AIProviderError } from '../AIProvider';
import type { AIProvider } from '../AIProvider';
import type {
  AIProviderConfig,
  AIProviderStatus,
  AIRequest,
  AIResponse,
} from '../types';

/**
 * The OpenAI chat-completions provider.
 *
 * The API key is read from the VS Code SecretStorage by the caller and is
 * never part of a request object, a log message or the webview state.
 */

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai' as const;
  readonly name = 'OpenAI';
  readonly requiresKey = true;
  readonly isExternal = true;
  readonly defaultModel = 'gpt-4o-mini';
  readonly models = ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'];
  readonly documentationUrl = 'https://platform.openai.com/docs';

  getStatus(hasKey: boolean): AIProviderStatus {
    return {
      id: this.id,
      name: this.name,
      hasKey,
      defaultModel: this.defaultModel,
      models: this.models,
      requiresKey: this.requiresKey,
      isExternal: this.isExternal,
      documentationUrl: this.documentationUrl,
    };
  }

  async send(
    request: AIRequest,
    config: AIProviderConfig,
    apiKey?: string
  ): Promise<AIResponse> {
    if (!apiKey) {
      throw new AIProviderError('not-configured', 'No API key is stored for OpenAI.');
    }

    const model = config.model || this.defaultModel;
    const startedAt = Date.now();

    const messages = [
      { role: 'system', content: request.systemPrompt },
      ...this.buildContextMessages(request),
      ...request.messages
        .filter((message) => message.role !== 'system')
        .slice(-config.maxContextMessages)
        .map((message) => ({ role: message.role, content: message.content })),
    ];

    const response = await this.request(
      {
        model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      },
      apiKey,
      request.signal,
      config.timeoutMs
    );

    const content = response.choices?.[0]?.message?.content ?? '';
    if (content.trim() === '') {
      throw new AIProviderError('empty-response', 'The provider returned an empty answer.');
    }

    return {
      content: content.trim(),
      provider: this.id,
      model,
      sources: [],
      fromKnowledgeBase: false,
      durationMs: Date.now() - startedAt,
      usedContext: request.context,
    };
  }

  /** Turns the shared context into a system message. */
  private buildContextMessages(request: AIRequest): Array<{ role: string; content: string }> {
    if (request.context.length === 0) {
      return [];
    }

    const context = request.context
      .map((item) => `### ${item.label} (${item.kind})\n${item.content}`)
      .join('\n\n');

    return [
      {
        role: 'system',
        content: `The student shared the following context. Use it as the factual basis of your answer:\n\n${context}`,
      },
    ];
  }

  private async request(
    body: unknown,
    apiKey: string,
    signal?: AbortSignal,
    timeoutMs = 60000
  ): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = (): void => controller.abort();
    signal?.addEventListener('abort', onAbort);

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw this.mapError(response.status, text);
      }

      const data = (await response.json()) as any;
      if (!data || !Array.isArray(data.choices)) {
        throw new AIProviderError('malformed-response', 'The answer could not be read.');
      }
      return data;
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        if (signal?.aborted) {
          throw new AIProviderError('cancelled', 'The request was cancelled.');
        }
        throw new AIProviderError('timeout', 'The provider did not answer in time.');
      }
      throw new AIProviderError('network', error instanceof Error ? error.message : 'Network error');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }

  private mapError(status: number, body: string): AIProviderError {
    if (status === 401 || status === 403) {
      return new AIProviderError('invalid-key', 'The API key was rejected.');
    }
    if (status === 429) {
      const retryAfter = /retry.after["':=\s]+(\d+)/i.exec(body);
      return new AIProviderError(
        'rate-limit',
        'Too many requests.',
        retryAfter ? Number(retryAfter[1]) : undefined
      );
    }
    if (status === 400) {
      return new AIProviderError('unsupported-model', 'The provider rejected the request.');
    }
    if (status >= 500) {
      return new AIProviderError('server', 'The provider reported an internal error.');
    }
    return new AIProviderError('server', `The provider answered with status ${status}.`);
  }
}
