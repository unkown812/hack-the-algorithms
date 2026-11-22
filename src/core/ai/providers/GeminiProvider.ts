import { AIProviderError } from '../AIProvider';
import type { AIProvider } from '../AIProvider';
import {
  createRequestControl,
  readEventStream,
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
 * The Google Gemini provider.
 *
 * The key is passed in the query string of the request, so it never appears
 * in a log message or in the webview state.
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiProvider implements AIProvider {
  readonly id = 'gemini' as const;
  readonly name = 'Google Gemini';
  readonly requiresKey = true;
  readonly isExternal = true;
  readonly supportsStreaming = true;
  readonly defaultModel = 'gemini-2.0-flash';
  readonly models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
  readonly documentationUrl = 'https://ai.google.dev/gemini-api/docs';

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

  async send(
    request: AIRequest,
    config: AIProviderConfig,
    apiKey?: string
  ): Promise<AIResponse> {
    if (!apiKey) {
      throw new AIProviderError('not-configured', 'No API key is stored for Gemini.');
    }

    const model = config.model || this.defaultModel;
    const startedAt = Date.now();

    const data = await this.request(
      `${BASE}/${model}:generateContent`,
      apiKey,
      {
        contents: this.buildContents(request, config),
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
        },
        systemInstruction: { parts: [{ text: request.systemPrompt }] },
      },
      request.signal,
      config.timeoutMs
    );

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('')
      .trim();

    if (!text) {
      const blocked = data?.promptFeedback?.blockReason;
      throw new AIProviderError(
        blocked ? 'malformed-response' : 'empty-response',
        blocked ? `The request was blocked (${blocked}).` : 'The provider returned an empty answer.'
      );
    }

    return {
      content: text,
      provider: this.id,
      model,
      sources: [],
      fromKnowledgeBase: false,
      durationMs: Date.now() - startedAt,
      usedContext: request.context,
    };
  }

  /**
   * Sends the request and delivers the answer piece by piece.
   * The streaming endpoint of Gemini answers with server-sent events.
   */
  async stream(
    request: AIRequest,
    config: AIProviderConfig,
    apiKey: string | undefined,
    onChunk: (chunk: AIChunk) => void
  ): Promise<AIResponse> {
    if (!apiKey) {
      throw new AIProviderError('not-configured', 'No API key is stored for Gemini.');
    }

    const model = config.model || this.defaultModel;
    const startedAt = Date.now();

    const { controller, dispose } = createRequestControl(request.signal, config.timeoutMs);

    try {
      const response = await fetch(
        `${BASE}/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: this.buildContents(request, config),
            generationConfig: {
              temperature: config.temperature,
              maxOutputTokens: config.maxTokens,
            },
            systemInstruction: { parts: [{ text: request.systemPrompt }] },
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw this.mapError(response.status, text);
      }

      const content = (
        await readEventStream(response, { onText: (text) => onChunk({ text }) }, (payload) => {
          const data = payload as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const parts = data.candidates?.[0]?.content?.parts ?? [];
          const text = parts.map((part) => part.text ?? '').join('');
          return text === '' ? undefined : text;
        })
      ).trim();

      onChunk({ text: '', done: true });

      if (content === '') {
        throw new AIProviderError('empty-response', 'The provider returned an empty answer.');
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

  /** Builds the contents of the request. */
  private buildContents(
    request: AIRequest,
    config: AIProviderConfig
  ): Array<{ role: string; parts: Array<{ text: string }> }> {
    return [
      ...this.buildContextContents(request),
      ...request.messages
        .filter((message) => message.role !== 'system')
        .slice(-config.maxContextMessages)
        .map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
    ];
  }

  private buildContextContents(request: AIRequest): Array<{
    role: string;
    parts: Array<{ text: string }>;
  }> {
    if (request.context.length === 0) {
      return [];
    }

    const context = request.context
      .map((item) => `### ${item.label} (${item.kind})\n${item.content}`)
      .join('\n\n');

    return [
      {
        role: 'user',
        parts: [
          {
            text: `The student shared the following context. Use it as the factual basis of your answer:\n\n${context}`,
          },
        ],
      },
    ];
  }

  private async request(
    url: string,
    apiKey: string,
    body: unknown,
    signal?: AbortSignal,
    timeoutMs = 60000
  ): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = (): void => controller.abort();
    signal?.addEventListener('abort', onAbort);

    try {
      const response = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw this.mapError(response.status, text);
      }

      const data = (await response.json()) as any;
      if (!data || !Array.isArray(data.candidates)) {
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
    if (status === 400 && /api key not valid/i.test(body)) {
      return new AIProviderError('invalid-key', 'The API key was rejected.');
    }
    if (status === 400 && /not found|unsupported/i.test(body)) {
      return new AIProviderError('unsupported-model', 'The model is not supported.');
    }
    if (status === 401 || status === 403) {
      return new AIProviderError('invalid-key', 'The API key was rejected.');
    }
    if (status === 404 && /not found/i.test(body)) {
      return new AIProviderError('unsupported-model', 'The model is not supported.');
    }
    if (status === 429) {
      return new AIProviderError('rate-limit', 'Too many requests.');
    }
    if (status >= 500) {
      return new AIProviderError('server', 'The provider reported an internal error.');
    }
    return new AIProviderError('server', `The provider answered with status ${status}.`);
  }
}
