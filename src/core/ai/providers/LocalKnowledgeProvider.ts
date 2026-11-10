import { AIProviderError } from '../AIProvider';
import type { AIProvider } from '../AIProvider';
import { retrievalService } from '../AIRetrievalService';
import type {
  AIProviderConfig,
  AIProviderStatus,
  AIRequest,
  AIResponse,
  AISource,
} from '../types';

/**
 * The offline provider.
 *
 * It answers from the verified learning resources that ship with the
 * extension — the algorithm registry, the complexity topics, the practicals,
 * the viva questions and the question bank. No network access, no credential
 * and no invented content.
 *
 * This keeps the assistant useful when no provider is configured and makes
 * every feature testable without an API key.
 */
export class LocalKnowledgeProvider implements AIProvider {
  readonly id = 'local' as const;
  readonly name = 'Local knowledge base';
  readonly requiresKey = false;
  readonly isExternal = false;
  readonly defaultModel = 'bundled-resources';
  readonly models = ['bundled-resources'];
  readonly documentationUrl = undefined;

  getStatus(hasKey: boolean): AIProviderStatus {
    return {
      id: this.id,
      name: this.name,
      hasKey,
      defaultModel: this.defaultModel,
      models: this.models,
      requiresKey: this.requiresKey,
      isExternal: this.isExternal,
    };
  }

  async send(
    request: AIRequest,
    config: AIProviderConfig
  ): Promise<AIResponse> {
    const startedAt = Date.now();
    const question = [...request.messages].reverse().find((message) => message.role === 'user');

    if (!question) {
      throw new AIProviderError('empty-response', 'There is no question to answer.');
    }

    const documents = retrievalService.search(question.content, { limit: 4 });
    const sources: AISource[] = documents.map((document) => ({
      title: document.title,
      origin: document.origin,
      reference: document.reference,
    }));

    const sharedContext = request.context
      .map((item) => `### ${item.label}\n${item.content}`)
      .join('\n\n');

    const sections: string[] = [];

    if (sharedContext.trim()) {
      sections.push(
        'Here is the context you shared — the answer below is built on it and on the verified material of the extension.',
        '',
        sharedContext
      );
    }

    if (documents.length === 0) {
      sections.push(
        'I could not find matching material in the bundled learning resources.',
        '',
        'The local knowledge base contains the algorithm registry (theory, pseudocode and complexity), the complexity topics, the ten practical exercises, the viva questions and the practice question bank. Try naming an algorithm — for example "merge sort", "binary search" or "0/1 knapsack" — or attach a piece of code, a compiler diagnostic or a visualization step as context.',
        '',
        'For a free-form explanation, configure an AI provider in the settings of the assistant.'
      );
    } else {
      sections.push(
        `Here is what the verified learning resources of the extension say about “${question.content.trim()}”.`
      );
      for (const document of documents) {
        sections.push(
          '',
          `#### ${document.title}`,
          '',
          document.content
        );
      }
      sections.push(
        '',
        'Configure an AI provider in the settings for a free-form, personalised explanation of your own wording.'
      );
    }

    return {
      content: sections.join('\n'),
      provider: this.id,
      model: this.defaultModel,
      sources,
      fromKnowledgeBase: true,
      durationMs: Date.now() - startedAt,
      usedContext: request.context,
    };
  }
}
