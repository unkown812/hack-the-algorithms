import { AIProviderError } from '../AIProvider';
import type { AIProvider } from '../AIProvider';
import {
  createRequestControl,
  readLineStream,
  toProviderError,
} from './streamUtils';
import type {
  AIChunk,
  AIProviderConfig,
  AIProviderStatus,
  AIRequest,
  AIResponse,
} from '../types';

/**
 * The provider for a local model server.
 *
 * It talks to an Ollama-compatible server (`/api/chat`) that runs on the
 * machine of the student — the data never leaves the computer and no API key
 * is needed. The address is configurable, so LM Studio, llama.cpp servers
 * and other OpenAI-compatible runtimes can be used as well when they expose
 * the Ollama interface.
 *
 * The provider degrades gracefully: when no server is running, the error
 * message explains how to start one instead of failing silently.
 */
export class LocalLLMProvider implements AIProvider {
  readonly id = 'local-llm' as const;
  readonly name = 'Local model (Ollama compatible)';
  readonly requiresKey = false;
  /** The server runs on the machine of the student — nothing leaves it. */
  readonly isExternal = false;
  readonly supportsStreaming = true;
  readonly defaultModel = 'llama3.2';
  readonly models = ['llama3.2', 'qwen2.5', 'mistral', 'gemma3', 'phi4'];
  readonly documentationUrl = 'https://ollama.com';

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
      supportsStreaming: this.supportsStreaming,
    };
  }

  /**
   * Asks the server which models it has.
   * The result is empty when no server is reachable.
   */
  async listModels(baseUrl: string, timeoutMs = 3000): Promise<string[]> {
    try {
      const response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        return [];
      }
      const data = (await response.json()) as { models?: Array<{ name?: string }> };
      return (data.models ?? [])
        .map((model) => model.name)
        .filter((name): name is string => typeof name === 'string');
    } catch {
      return [];
    }
  }

  async send(
    request: AIRequest,
    config: AIProviderConfig
  ): Promise<AIResponse> {
    const startedAt = Date.now();
    const model = config.model || this.defaultModel;
    const baseUrl = normalizeBaseUrl(config.localBaseUrl);

    const { controller, dispose } = createRequestControl(request.signal, config.timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: this.buildMessages(request, config),
          stream: false,
          options: {
            temperature: config.temperature,
            num_predict: config.maxTokens,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw this.mapError(response.status, text, baseUrl);
      }

      const data = (await response.json()) as {
        message?: { content?: string };
        response?: string;
      };

      const content = (data.message?.content ?? data.response ?? '').trim();
      if (content === '') {
        throw new AIProviderError('empty-response', 'The local model returned an empty answer.');
      }

      return {
        content,
        provider: this.id,
        model,
        sources: [],
        fromKnowledgeBase: false,
        durationMs: Date.now() - startedAt,
        usedContext: request.context,
      };
    } catch (error) {
      throw toProviderError(error, request.signal);
    } finally {
      dispose();
    }
  }

  /**
   * Sends the request to the local server and delivers the answer piece by
   * piece. The Ollama interface answers with newline-delimited JSON.
   */
  async stream(
    request: AIRequest,
    config: AIProviderConfig,
    _apiKey: string | undefined,
    onChunk: (chunk: AIChunk) => void
  ): Promise<AIResponse> {
    const startedAt = Date.now();
    const model = config.model || this.defaultModel;
    const baseUrl = normalizeBaseUrl(config.localBaseUrl);

    const { controller, dispose } = createRequestControl(request.signal, config.timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: this.buildMessages(request, config),
          stream: true,
          options: {
            temperature: config.temperature,
            num_predict: config.maxTokens,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw this.mapError(response.status, text, baseUrl);
      }

      const content = (
        await readLineStream(response, { onText: (text) => onChunk({ text }) }, (payload) => {
          const data = payload as { message?: { content?: string }; response?: string };
          return data.message?.content ?? data.response ?? undefined;
        })
      ).trim();

      onChunk({ text: '', done: true });

      if (content === '') {
        throw new AIProviderError('empty-response', 'The local model returned an empty answer.');
      }

      return {
        content,
        provider: this.id,
        model,
        sources: [],
        fromKnowledgeBase: false,
        durationMs: Date.now() - startedAt,
        usedContext: request.context,
      };
    } catch (error) {
      throw toProviderError(error, request.signal);
    } finally {
      dispose();
    }
  }

  private buildMessages(
    request: AIRequest,
    config: AIProviderConfig
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: request.systemPrompt },
    ];

    if (request.context.length > 0) {
      messages.push({
        role: 'system',
        content: `The student shared the following context. Use it as the factual basis of your answer:\n\n${request.context
          .map((item) => `### ${item.label} (${item.kind})\n${item.content}`)
          .join('\n\n')}`,
      });
    }

    messages.push(
      ...request.messages
        .filter((message) => message.role !== 'system')
        .slice(-config.maxContextMessages)
        .map((message) => ({ role: message.role, content: message.content }))
    );

    return messages;
  }

  private mapError(status: number, body: string, baseUrl: string): AIProviderError {
    if (status === 404) {
      return new AIProviderError(
        'unsupported-model',
        `The local model server does not know this model. Start it with "ollama pull <model>" or pick another model. (${baseUrl})`
      );
    }
    if (status === 400 && /model/i.test(body)) {
      return new AIProviderError(
        'unsupported-model',
        `The local model server rejected the model. (${baseUrl})`
      );
    }
    if (status >= 500) {
      return new AIProviderError('server', 'The local model server reported an internal error.');
    }
    return new AIProviderError(
      'network',
      `The local model server could not be reached at ${baseUrl}. Start it (for example "ollama serve") and try again.`
    );
  }
}

/** Removes a trailing slash from the base URL. */
function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = (baseUrl || 'http://localhost:11434').trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}
