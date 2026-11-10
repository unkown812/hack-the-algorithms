import { AIProviderError, describeProviderError } from './AIProvider';
import type { AIProvider } from './AIProvider';
import { AIContextBuilder } from './AIContextBuilder';
import type { ContextSelection } from './AIContextBuilder';
import { AIResponseValidator } from './AIResponseValidator';
import { AIConversationManager } from './AIConversationManager';
import { buildSystemPrompt } from './prompts/system/tutor.prompt';
import type {
  AIContextItem,
  AIProviderConfig,
  AIProviderId,
  AIRequest,
  AIResponse,
  AISource,
  AIMessage,
  ExplanationMode,
} from './types';

/**
 * The service that answers a question.
 *
 * It is provider independent: the concrete provider and the credential are
 * resolved through the injected resolver, which lives in the extension host.
 */

export interface ProviderAccess {
  provider: AIProvider;
  /** The credential — only the extension host ever holds it. */
  apiKey?: string;
}

export type ProviderResolver = (id: AIProviderId) => ProviderAccess | undefined;

export interface AskRequest {
  question: string;
  mode?: ExplanationMode;
  /** The context the student explicitly selected. */
  selection?: ContextSelection;
  /** The conversation the question belongs to. */
  conversationId?: string;
  /** The task that shapes the prompt, e.g. "algorithm-explanation". */
  task?: string;
  signal?: AbortSignal;
}

export interface AskResult {
  response: AIResponse;
  /** The problems the validator found in the answer. */
  warnings: string[];
  /** The context that was actually sent. */
  context: AIContextItem[];
  /** The conversation the answer was added to. */
  conversationId: string;
}

export class AIService {
  private readonly contextBuilder = new AIContextBuilder();
  private readonly validator = new AIResponseValidator();
  readonly conversations = new AIConversationManager();

  constructor(
    private readonly resolveProvider: ProviderResolver,
    private readonly getConfiguration: () => AIProviderConfig
  ) {}

  /** Answers a question of the student. */
  async ask(request: AskRequest): Promise<AskResult> {
    const config = this.getConfiguration();
    const mode = request.mode ?? 'beginner';

    const conversationId =
      request.conversationId ?? this.conversations.create(mode).id;

    const userMessage = this.conversations.addMessage(conversationId, {
      role: 'user',
      content: request.question,
      mode,
    });

    const built = this.contextBuilder.build(request.selection ?? {}, request.question, config);

    const messages: AIMessage[] = this.conversations.messages(conversationId);

    const aiRequest: AIRequest = {
      messages,
      systemPrompt: buildSystemPrompt(mode, request.task),
      context: built.items,
      mode,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      task: request.task,
      signal: request.signal,
    };

    const access = this.resolveProvider(config.provider);
    if (!access) {
      throw new AIProviderError('not-configured', 'The selected provider is not available.');
    }

    if (config.allowExternalContext && access.provider.isExternal && built.items.length > 0) {
      // The student agreed to share the selected context — nothing else is sent.
    }

    let response: AIResponse;
    try {
      response = await access.provider.send(aiRequest, config, access.apiKey);
    } catch (error) {
      if (error instanceof AIProviderError) {
        const message = describeProviderError(error);
        this.conversations.addMessage(conversationId, {
          role: 'assistant',
          content: message,
          mode,
          error: true,
        });
        throw error;
      }
      throw new AIProviderError(
        'server',
        error instanceof Error ? error.message : 'The request failed.'
      );
    }

    const sources: AISource[] =
      response.sources.length > 0
        ? response.sources
        : built.documents.map((document) => ({
            title: document.title,
            origin: document.origin,
            reference: document.reference,
          }));

    const validation = this.validator.validate({ ...response, sources }, built.items);

    this.conversations.addMessage(conversationId, {
      role: 'assistant',
      content: validation.content,
      mode,
      sources,
      fromKnowledgeBase: response.fromKnowledgeBase,
    });

    void userMessage;

    return {
      response: { ...response, content: validation.content, sources },
      warnings: validation.warnings,
      context: built.items,
      conversationId,
    };
  }

  /** The suggested questions shown in the empty chat. */
  getSuggestions(context?: { algorithmId?: string }): Array<{ id: string; text: string; task?: string }> {
    const suggestions: Array<{ id: string; text: string; task?: string }> = [
      { id: 'explain-algorithm', text: 'Explain an algorithm.', task: 'algorithm-explanation' },
      { id: 'complexity', text: 'Understand time complexity.', task: 'complexity' },
      { id: 'debug-code', text: 'Debug my C program.', task: 'debugging' },
      { id: 'practical-exam', text: 'Prepare for practical exams.', task: 'practical' },
      { id: 'generate-questions', text: 'Generate practice questions.', task: 'question-generation' },
    ];

    if (context?.algorithmId) {
      suggestions.unshift({
        id: 'explain-current',
        text: `Explain ${context.algorithmId.replace(/-/g, ' ')}.`,
        task: 'algorithm-explanation',
      });
    }

    return suggestions;
  }
}
