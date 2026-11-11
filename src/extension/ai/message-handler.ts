import * as vscode from 'vscode';
import { AI_MESSAGES } from '../../shared/constants';
import { AIProviderError } from '../../core/ai/AIProvider';
import { AIService } from '../../core/ai/AIService';
import type { ContextSelection } from '../../core/ai/AIContextBuilder';
import type {
  AIProviderConfig,
  AIProviderId,
  ExplanationMode,
} from '../../core/ai/types';
import { AIProviderManager } from '../services/AIProviderManager';
import { AISecretStorage } from '../services/AISecretStorage';
import type { LearningData } from '../../core/practice/types';
import { QuestionGenerator } from '../../core/ai/features/QuestionGenerator';
import type { QuestionGeneratorRequest } from '../../core/ai/features/QuestionGenerator';
import { PracticalAssistant } from '../../core/ai/features/PracticalAssistant';

/**
 * Handles the Phase 7 messages of the AI learning assistant.
 *
 * All provider communication stays in the extension host. The webview never
 * receives a credential and never sends a request directly — it sends its
 * question plus the context items the student explicitly selected, and this
 * handler decides (together with the consent flag of the configuration)
 * which context actually leaves the machine.
 */
export class AIMessageHandler {
  private readonly storage: AISecretStorage;
  private readonly manager: AIProviderManager;
  private readonly service: AIService;
  private readonly requests = new Map<string, AbortController>();
  private readonly learningDataStore: { read(): LearningData | undefined };

  constructor(
    context: vscode.ExtensionContext,
    private readonly post: (message: { type: string; payload?: unknown }) => void
  ) {
    this.storage = new AISecretStorage(context.secrets);
    this.manager = new AIProviderManager(this.storage);
    this.service = new AIService(
      this.manager.resolve,
      () => this.manager.getConfiguration()
    );

    this.learningDataStore = {
      read: () => context.globalState.get('daa.learningData'),
    };
  }

  /** Handles one message of the webview. */
  async handle(message: { type: string; payload?: unknown }): Promise<void> {
    const payload = (message.payload ?? {}) as Record<string, unknown>;

    try {
      switch (message.type) {
      case AI_MESSAGES.GET_AI_STATUS: {
        const statuses = await this.manager.getStatuses();
        const config = this.manager.getConfiguration();
        this.post({
          type: AI_MESSAGES.AI_STATUS,
          payload: {
            statuses,
            config,
            issues: await this.manager.validate(),
          },
        });
        break;
      }

      case AI_MESSAGES.SAVE_AI_CONFIG: {
        const changes = payload.config as Partial<AIProviderConfig>;
        const saved = await this.manager.saveConfiguration(changes ?? {});
        const statuses = await this.manager.getStatuses();
        this.post({
          type: AI_MESSAGES.AI_CONFIG_SAVED,
          payload: {
            config: saved,
            statuses,
            issues: await this.manager.validate(),
          },
        });
        break;
      }

      case AI_MESSAGES.SET_API_KEY: {
        const provider = String(payload.provider ?? '') as AIProviderId;
        const key = String(payload.apiKey ?? '');
        if (provider && key.trim()) {
          await this.manager.setApiKey(provider, key);
        }
        const statuses = await this.manager.getStatuses();
        this.post({ type: AI_MESSAGES.AI_KEY_SAVED, payload: { statuses } });
        break;
      }

      case AI_MESSAGES.CLEAR_API_KEY: {
        const provider = String(payload.provider ?? '') as AIProviderId;
        if (provider) {
          await this.manager.clearApiKey(provider);
        }
        const statuses = await this.manager.getStatuses();
        this.post({ type: AI_MESSAGES.AI_KEY_SAVED, payload: { statuses } });
        break;
      }

      case AI_MESSAGES.TEST_PROVIDER: {
        const result = await this.manager.testProvider();
        this.post({ type: AI_MESSAGES.AI_TEST_RESULT, payload: result });
        break;
      }

      case AI_MESSAGES.ASK_ASSISTANT: {
        await this.ask(payload);
        break;
      }

      case AI_MESSAGES.CANCEL_AI_REQUEST: {
        const requestId = String(payload.requestId ?? '');
        this.requests.get(requestId)?.abort();
        this.requests.delete(requestId);
        break;
      }

      case AI_MESSAGES.GET_CONVERSATIONS: {
        this.post({
          type: AI_MESSAGES.AI_CONVERSATIONS,
          payload: {
            conversations: this.service.conversations.list(),
          },
        });
        break;
      }

      case AI_MESSAGES.NEW_CONVERSATION: {
        const conversation = this.service.conversations.create(
          (payload.mode as ExplanationMode) ?? 'beginner'
        );
        this.post({
          type: AI_MESSAGES.AI_CONVERSATION_LOADED,
          payload: conversation,
        });
        break;
      }

      case AI_MESSAGES.OPEN_CONVERSATION: {
        const conversation = this.service.conversations.get(String(payload.conversationId ?? ''));
        if (conversation) {
          this.post({ type: AI_MESSAGES.AI_CONVERSATION_LOADED, payload: conversation });
        }
        break;
      }

      case AI_MESSAGES.DELETE_CONVERSATION: {
        this.service.conversations.remove(String(payload.conversationId ?? ''));
        this.post({
          type: AI_MESSAGES.AI_CONVERSATIONS,
          payload: { conversations: this.service.conversations.list() },
        });
        break;
      }

      case AI_MESSAGES.CLEAR_CONVERSATIONS: {
        this.service.conversations.clear();
        this.post({
          type: AI_MESSAGES.AI_CONVERSATIONS,
          payload: { conversations: [] },
        });
        break;
      }

      case AI_MESSAGES.SET_CONVERSATION_MODE: {
        this.service.conversations.setMode(
          String(payload.conversationId ?? ''),
          payload.mode as ExplanationMode
        );
        break;
      }

      case AI_MESSAGES.GENERATE_VIVA: {
        await this.generateViva(payload);
        break;
      }

      case AI_MESSAGES.GENERATE_QUESTIONS: {
        await this.generateQuestions(payload);
        break;
      }

      default:
        break;
      }
    } catch (error) {
      this.post({
        type: AI_MESSAGES.AI_ERROR,
        payload: {
          message: describe(error),
          provider: this.manager.getConfiguration().provider,
        },
      });
    }
  }

  /** Answers a question of the student. */
  private async ask(payload: Record<string, unknown>): Promise<void> {
    const requestId = String(payload.requestId ?? '');
    const controller = new AbortController();
    if (requestId) {
      this.requests.set(requestId, controller);
    }

    const selection = (payload.selection ?? {}) as ContextSelection;

    // The progress context is summarized locally from the Phase 6 data.
    if (payload.includeProgress === true) {
      selection.progress = this.summarizeProgress();
    }

    this.post({ type: AI_MESSAGES.AI_RESPONSE_STARTED, payload: { requestId } });

    try {
      const result = await this.service.ask({
        question: String(payload.question ?? ''),
        mode: payload.mode as ExplanationMode | undefined,
        task: payload.task as string | undefined,
        conversationId: payload.conversationId as string | undefined,
        selection,
        signal: controller.signal,
      });

      this.post({
        type: AI_MESSAGES.AI_RESPONSE,
        payload: {
          requestId,
          conversationId: result.conversationId,
          response: result.response,
          warnings: result.warnings,
          contextWithheld: result.contextWithheld,
          suggestions:
            (payload.suggestions as Array<{ id: string; text: string; task?: string }>) ??
            this.service.getSuggestions(),
        },
      });
    } catch (error) {
      if (error instanceof AIProviderError && error.kind === 'cancelled') {
        return;
      }
      this.post({
        type: AI_MESSAGES.AI_ERROR,
        payload: {
          requestId,
          message: describe(error),
          provider: this.manager.getConfiguration().provider,
        },
      });
    } finally {
      if (requestId) {
        this.requests.delete(requestId);
      }
    }
  }

  /** Generates viva questions from the bundled viva bank. */
  private async generateViva(payload: Record<string, unknown>): Promise<void> {
    const mode = payload.mode as ExplanationMode | undefined;
    const built = new PracticalAssistant().build({
      task: 'viva',
      question: String(payload.question ?? ''),
      mode,
    });

    await this.ask({
      ...payload,
      question: built.question,
      task: built.task,
      mode,
      conversationId: payload.conversationId as string | undefined,
    });
  }

  /** Generates practice questions from the verified question bank. */
  private async generateQuestions(payload: Record<string, unknown>): Promise<void> {
    const mode = payload.mode as ExplanationMode | undefined;
    const request = (payload.request ?? {}) as QuestionGeneratorRequest;

    const built = new QuestionGenerator().build({ ...request, mode });

    // The verified questions that match the request — sent as context.
    const questions = new QuestionGenerator().getValidQuestions(request);
    const questionPreview = questions
      .slice(0, 5)
      .map((question) => `- ${question.title}: ${question.question} (answer: ${question.correctAnswer})`)
      .join('\n');

    const fullQuestion = questionPreview
      ? `${built.question}\n\nQuestions from the verified bank that match the request:\n${questionPreview}`
      : built.question;

    await this.ask({
      ...payload,
      question: fullQuestion,
      task: built.task,
      mode,
      conversationId: payload.conversationId as string | undefined,
    });
  }

  /** Builds the local progress summary for the context. */
  private summarizeProgress(): NonNullable<ContextSelection['progress']> {
    const data = this.learningDataStore.read();
    if (!data) {
      return { answered: 0, accuracy: 0, weakTopics: [], failedChallenges: [] };
    }

    const answered = data.statistics.questionsAnswered;
    const correct = data.statistics.questionsCorrect;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    const weakTopics: string[] = [];
    for (const [topicId, progress] of Object.entries(data.topicProgress)) {
      if (progress.questionsAttempted >= 5) {
        const topicAccuracy = progress.correctAnswers / progress.questionsAttempted;
        if (topicAccuracy < 0.6) {
          weakTopics.push(topicId);
        }
      }
    }

    const failedChallenges = [
      ...new Set(
        data.submissions
          .filter((submission) => submission.status !== 'accepted')
          .map((submission) => submission.challengeId)
      ),
    ];

    return { answered, accuracy, weakTopics, failedChallenges };
  }
}

/** Reads the source of the active editor selection — used by the editor commands. */
export function getSelectedCode(): { code: string; fileName: string } | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return undefined;
  }

  const selection = editor.selection;
  const text = selection.isEmpty
    ? undefined
    : editor.document.getText(selection);

  if (!text || !text.trim()) {
    return undefined;
  }

  return {
    code: text,
    fileName: editor.document.fileName.split(/[\\/]/).pop() ?? 'selection',
  };
}

function describe(error: unknown): string {
  if (error instanceof AIProviderError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
