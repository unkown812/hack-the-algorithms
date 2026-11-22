import { AIProviderError, describeProviderError } from './AIProvider';
import type { AIProvider } from './AIProvider';
import { AIContextBuilder } from './AIContextBuilder';
import type { ContextSelection } from './AIContextBuilder';
import { AIResponseValidator } from './AIResponseValidator';
import { AIConversationManager } from './AIConversationManager';
import { buildSystemPrompt } from './prompts/system/tutor.prompt';
import { AlgorithmTutor } from './features/AlgorithmTutor';
import { CodeExplainer } from './features/CodeExplainer';
import { DebuggingAssistant } from './features/DebuggingAssistant';
import { ComplexityTutor } from './features/ComplexityTutor';
import { VisualizationAssistant } from './features/VisualizationAssistant';
import { PracticalAssistant } from './features/PracticalAssistant';
import { QuestionGenerator } from './features/QuestionGenerator';
import { LearningAdvisor } from './features/LearningAdvisor';
import {
  parseGeneratedQuestions,
  QUESTION_GENERATION_INSTRUCTION,
} from './QuestionJsonParser';
import type {
  AIChunk,
  AIContextItem,
  AIProviderConfig,
  AIProviderId,
  AIQuestionDraft,
  AIQuestionRequest,
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

export type ProviderResolver = (
  id: AIProviderId
) => Promise<ProviderAccess | undefined> | ProviderAccess | undefined;

export interface AskRequest {
  question: string;
  mode?: ExplanationMode;
  /** The context the student explicitly selected. */
  selection?: ContextSelection;
  /** The conversation the question belongs to. */
  conversationId?: string;
  /** The task that shapes the prompt, e.g. "algorithm-explanation". */
  task?: string;
  /**
   * Replaces the newest answer of the conversation instead of adding another
   * turn. The student's question is kept once in the history.
   */
  regenerate?: boolean;
  signal?: AbortSignal;
  /**
   * Called for every piece of the answer while it is generated.
   * When it is missing — or the provider cannot stream — the answer is
   * delivered at once.
   */
  onChunk?: (chunk: AIChunk) => void;
}

export interface AskResult {
  response: AIResponse;
  /** The problems the validator found in the answer. */
  warnings: string[];
  /** The context that was actually sent. */
  context: AIContextItem[];
  /** The conversation the answer was added to. */
  conversationId: string;
  /** True when context was removed because the consent was missing. */
  contextWithheld: boolean;
  /** True when the context was shortened to fit the configured budget. */
  contextTruncated: boolean;
  /** True when the answer was delivered piece by piece. */
  streamed: boolean;
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

    // A stale id (for example after a host restart) must not lose the answer.
    const existingConversation =
      request.conversationId && this.conversations.get(request.conversationId)
        ? request.conversationId
        : undefined;
    const conversationId = existingConversation ?? this.conversations.create(mode).id;

    if (request.regenerate && existingConversation) {
      // The old answer is replaced; the question stays in the history once.
      this.conversations.removeLastAssistant(conversationId);
    } else {
      this.conversations.addMessage(conversationId, {
        role: 'user',
        content: request.question,
        mode,
      });
    }

    const built = this.contextBuilder.build(request.selection ?? {}, request.question, config);

    const access = await this.resolveProvider(config.provider);
    if (!access) {
      throw new AIProviderError('not-configured', 'The selected provider is not available.');
    }

    /**
     * Privacy rule: user-selected context (code, execution results,
     * diagnostics, progress) only leaves the machine when the student gave
     * the explicit consent or the provider is local. The bundled learning
     * resources are not personal data and may ground an external answer.
     */
    const contextWithheld =
      access.provider.isExternal &&
      !config.allowExternalContext &&
      built.items.some((item) => item.kind !== 'documentation');

    const contextToSend = contextWithheld
      ? built.items.filter((item) => item.kind === 'documentation')
      : built.items;

    const messages: AIMessage[] = this.conversations.messages(conversationId);

    const aiRequest: AIRequest = {
      messages,
      systemPrompt: buildSystemPrompt(mode, request.task),
      context: contextToSend,
      mode,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      task: request.task,
      signal: request.signal,
    };

    let response: AIResponse;
    let streamed = false;
    try {
      /**
       * The answer is streamed when the student waits for it in the chat and
       * the provider supports it. Otherwise the answer arrives at once.
       */
      const canStream =
        config.streaming &&
        Boolean(request.onChunk) &&
        Boolean(access.provider.stream) &&
        access.provider.supportsStreaming !== false;

      if (canStream && access.provider.stream) {
        response = await access.provider.stream(
          aiRequest,
          config,
          access.apiKey,
          request.onChunk!
        );
        streamed = true;
      } else {
        response = await access.provider.send(aiRequest, config, access.apiKey);
      }
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

    return {
      response: { ...response, content: validation.content, sources },
      warnings: validation.warnings,
      context: contextToSend,
      conversationId,
      contextWithheld,
      // A withheld context is not "shortened" — the consent notice explains it.
      contextTruncated: built.truncated && !contextWithheld,
      streamed,
    };
  }

  /**
   * Generates practice questions with the provider.
   *
   * The questions are returned as *candidates* — they are not usable until
   * the student reviewed them in the review workflow.
   */
  async generateQuestions(
    request: AIQuestionRequest,
    signal?: AbortSignal
  ): Promise<{ candidates: Array<Partial<AIQuestionDraft>>; raw: string; warnings: string[] }> {
    const config = this.getConfiguration();
    const access = await this.resolveProvider(config.provider);
    if (!access) {
      throw new AIProviderError('not-configured', 'The selected provider is not available.');
    }

    const count = Math.min(Math.max(request.count ?? 5, 1), 20);
    const instructions = [
      `Write ${count} practice questions${request.topic ? ` about "${request.topic}"` : ''}.`,
      request.algorithmId ? `They must be about the algorithm "${request.algorithmId}".` : '',
      request.difficulty ? `The difficulty is "${request.difficulty}".` : '',
      request.types?.length ? `Only these types are allowed: ${request.types.join(', ')}.` : '',
      request.instruction ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const aiRequest: AIRequest = {
      messages: [
        { id: 'generate', role: 'user', content: instructions, createdAt: Date.now() },
      ],
      systemPrompt: `${buildSystemPrompt(request.difficulty === 'beginner' ? 'beginner' : 'detailed', 'question-generation')}\n\n${QUESTION_GENERATION_INSTRUCTION}`,
      context: [],
      mode: 'detailed',
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      task: 'question-generation',
      signal,
    };

    let response: AIResponse;
    try {
      response = await access.provider.send(aiRequest, config, access.apiKey);
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        'server',
        error instanceof Error ? error.message : 'The generation failed.'
      );
    }

    const parsed = parseGeneratedQuestions(response.content);
    const warnings: string[] = [];

    if (parsed.length === 0) {
      warnings.push(
        'The provider did not return questions in the expected format — the raw answer is shown instead.'
      );
    } else if (parsed.length < count) {
      warnings.push(
        `The provider returned ${parsed.length} of the requested ${count} questions.`
      );
    }

    return {
      candidates: parsed.map((entry) => entry.candidate),
      raw: response.content,
      warnings,
    };
  }

  /**
   * The suggested questions shown in the empty chat and under an answer.
   *
   * When the request had a task, the follow-up questions of the matching
   * feature are returned — a code explanation offers a dry run, a complexity
   * explanation offers the recurrence, and so on. Otherwise the general
   * entry points are shown.
   */
  getSuggestions(context?: {
    algorithmId?: string;
    task?: string;
  }): Array<{ id: string; text: string; task?: string }> {
    const task = context?.task;

    switch (task) {
    case 'algorithm-explanation':
      return new AlgorithmTutor()
        .getFollowUps(context?.algorithmId ?? 'bubble-sort')
        .map((suggestion) => ({ ...suggestion, task }));
    case 'code-explanation':
      return new CodeExplainer()
        .getSuggestions()
        .map((suggestion) => ({ ...suggestion, task }));
    case 'debugging':
      return new DebuggingAssistant()
        .getSuggestions()
        .map((suggestion) => ({ ...suggestion, task }));
    case 'complexity':
      return new ComplexityTutor()
        .getSuggestions()
        .map((suggestion) => ({ ...suggestion, task }));
    case 'visualization':
      return new VisualizationAssistant()
        .getSuggestions()
        .map((suggestion) => ({ ...suggestion, task }));
    case 'practical':
    case 'viva':
    case 'mock-exam':
    case 'mock-exam-suggest':
      return new PracticalAssistant()
        .getSuggestions(task)
        .map((suggestion) => ({ ...suggestion, task }));
    case 'question-generation':
      return new QuestionGenerator()
        .getSuggestions()
        .map((suggestion) => ({ ...suggestion, task }));
    case 'learning-advice':
      return new LearningAdvisor()
        .getSuggestions()
        .map((suggestion) => ({ ...suggestion, task }));
    default:
      break;
    }

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
