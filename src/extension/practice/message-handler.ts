import * as vscode from 'vscode';
import { PRACTICE_MESSAGES } from '../../shared/constants';
import { PracticeService } from '../../core/practice/PracticeService';
import { LearningDataStore } from '../../core/storage/LearningDataStore';
import { ALL_QUESTIONS } from '../../core/questions/QuestionRegistry';
import { CODING_CHALLENGES } from '../../core/challenges/challenges';
import { PRACTICALS } from '../../core/practicals/practicals';
import { VIVA_QUESTIONS } from '../../core/practicals/VivaQuestionService';
import { MOCK_EXAMS } from '../../core/practicals/MockExamEngine';
import { TOPICS } from '../../core/progress/TopicProgressTracker';
import type { QuestionFilter } from '../../core/practice/types';

/**
 * Handles the Phase 6 messages of the Practice Centre.
 *
 * Everything is computed locally: the question bank, the challenges and the
 * practicals are bundled with the extension and the progress data stays on
 * the machine.
 */
export class PracticeMessageHandler {
  private readonly service: PracticeService;

  constructor(
    context: vscode.ExtensionContext,
    private readonly post: (message: { type: string; payload?: unknown }) => void
  ) {
    const store = new LearningDataStore({
      read: () => context.globalState.get('daa.learningData'),
      write: (data) => {
        void context.globalState.update('daa.learningData', data);
      },
    });
    this.service = new PracticeService(store);
  }

  /** Handles one message of the webview. */
  async handle(message: { type: string; payload?: unknown }): Promise<void> {
    const payload = (message.payload ?? {}) as Record<string, unknown>;

    try {
      switch (message.type) {
      case PRACTICE_MESSAGES.GET_PRACTICE_OVERVIEW: {
        this.post({
          type: PRACTICE_MESSAGES.PRACTICE_OVERVIEW,
          payload: {
            questionCount: ALL_QUESTIONS.length,
            challengeCount: CODING_CHALLENGES.length,
            practicalCount: PRACTICALS.length,
            vivaCount: VIVA_QUESTIONS.length,
            mockExamCount: MOCK_EXAMS.length,
            categories: TOPICS.map((topic) => ({
              id: topic.id,
              label: topic.label,
              category: topic.category,
            })),
            presets: this.service.getQuizPresets(),
            bankIssues: this.service.validateBank().length,
          },
        });
        break;
      }

      case PRACTICE_MESSAGES.GET_QUESTIONS: {
        const filter = (payload.filter ?? {}) as QuestionFilter;
        this.post({
          type: PRACTICE_MESSAGES.QUESTIONS_LOADED,
          payload: { questions: this.service.getQuestions(filter) },
        });
        break;
      }

      case PRACTICE_MESSAGES.START_QUIZ: {
        const config = payload.config as Parameters<PracticeService['startQuiz']>[0];
        const started = this.service.startQuiz(config);
        this.post({ type: PRACTICE_MESSAGES.QUIZ_STARTED, payload: started });
        break;
      }

      case PRACTICE_MESSAGES.ANSWER_QUIZ: {
        const attemptId = String(payload.attemptId ?? '');
        const questionId = String(payload.questionId ?? '');
        const answer = payload.answer as string | string[];
        const evaluation = this.service.answerQuiz(attemptId, questionId, answer);
        this.post({
          type: PRACTICE_MESSAGES.QUIZ_RESULT,
          payload: { partial: true, questionId, evaluation },
        });
        break;
      }

      case PRACTICE_MESSAGES.MARK_QUESTION: {
        const attemptId = String(payload.attemptId ?? '');
        const questionId = String(payload.questionId ?? '');
        const marked = Boolean(payload.marked);
        const markedIds = this.service.markQuestion(attemptId, questionId, marked);
        this.post({
          type: PRACTICE_MESSAGES.QUIZ_RESULT,
          payload: { partial: true, markedQuestionIds: markedIds },
        });
        break;
      }

      case PRACTICE_MESSAGES.SUBMIT_QUIZ: {
        const attemptId = String(payload.attemptId ?? '');
        const result = this.service.submitQuiz(attemptId);
        this.post({ type: PRACTICE_MESSAGES.QUIZ_RESULT, payload: { result } });
        break;
      }

      case PRACTICE_MESSAGES.ABANDON_QUIZ: {
        this.service.abandonQuiz(String(payload.attemptId ?? ''));
        break;
      }

      case PRACTICE_MESSAGES.GET_ACTIVE_QUIZ: {
        const attempt = this.service.getActiveQuiz();
        this.post({ type: PRACTICE_MESSAGES.QUIZ_STARTED, payload: { attempt } });
        break;
      }

      case PRACTICE_MESSAGES.GET_CHALLENGES: {
        const challenges = this.service.getChallenges({
          category: payload.category ? String(payload.category) : undefined,
          difficulty: payload.difficulty ? String(payload.difficulty) : undefined,
        });
        this.post({ type: PRACTICE_MESSAGES.CHALLENGES_LOADED, payload: { challenges } });
        break;
      }

      case PRACTICE_MESSAGES.GET_CHALLENGE: {
        const challenge = this.service.getChallenge(String(payload.challengeId ?? ''));
        this.post({ type: PRACTICE_MESSAGES.CHALLENGE_LOADED, payload: { challenge } });
        break;
      }

      case PRACTICE_MESSAGES.SUBMIT_CHALLENGE: {
        const challengeId = String(payload.challengeId ?? '');
        const source = String(payload.source ?? '');
        const result = await this.service.submitChallenge(challengeId, source);
        this.post({ type: PRACTICE_MESSAGES.CHALLENGE_RESULT, payload: result });
        break;
      }

      case PRACTICE_MESSAGES.GET_REFERENCE_SOLUTION: {
        const solution = this.service.getReferenceSolution(String(payload.challengeId ?? ''));
        this.post({
          type: PRACTICE_MESSAGES.CHALLENGE_LOADED,
          payload: { challenge: this.service.getChallenge(String(payload.challengeId ?? '')), referenceSolution: solution },
        });
        break;
      }

      case PRACTICE_MESSAGES.GET_PRACTICALS: {
        const practicals = this.service.getPracticals(
          payload.category ? String(payload.category) : undefined
        );
        this.post({ type: PRACTICE_MESSAGES.PRACTICALS_LOADED, payload: { practicals } });
        break;
      }

      case PRACTICE_MESSAGES.GET_PRACTICAL: {
        const practical = this.service.getPractical(
          String(payload.practicalId ?? ''),
            (payload.mode ?? 'guided') as 'guided' | 'independent' | 'mock',
            Boolean(payload.revealed)
        );
        this.post({ type: PRACTICE_MESSAGES.PRACTICAL_LOADED, payload: { practical } });
        break;
      }

      case PRACTICE_MESSAGES.GET_MOCK_EXAMS: {
        this.post({
          type: PRACTICE_MESSAGES.MOCK_EXAMS_LOADED,
          payload: { exams: this.service.getMockExams() },
        });
        break;
      }

      case PRACTICE_MESSAGES.RECORD_MOCK_EXAM: {
        const result = this.service.recordMockExam(
          String(payload.examId ?? ''),
            (payload.results ?? {}) as Record<string, never>,
            Number(payload.startedAt ?? Date.now())
        );
        this.post({ type: PRACTICE_MESSAGES.MOCK_EXAMS_LOADED, payload: { result } });
        break;
      }

      case PRACTICE_MESSAGES.GET_VIVA: {
        const questions = this.service.getVivaQuestions(
          payload.topic ? String(payload.topic) : undefined
        );
        this.post({ type: PRACTICE_MESSAGES.VIVA_LOADED, payload: { questions } });
        break;
      }

      case PRACTICE_MESSAGES.TOGGLE_BOOKMARK: {
        const bookmarks = this.service.toggleBookmark({
          id: `${String(payload.kind ?? 'question')}:${String(payload.itemId ?? '')}`,
          kind: payload.kind as never,
          itemId: String(payload.itemId ?? ''),
          title: String(payload.title ?? ''),
          category: payload.category ? String(payload.category) : undefined,
        });
        this.post({ type: PRACTICE_MESSAGES.BOOKMARKS_LOADED, payload: { bookmarks } });
        break;
      }

      case PRACTICE_MESSAGES.GET_BOOKMARKS: {
        const bookmarks = this.service.getBookmarks({
          kind: payload.kind ? (payload.kind as never) : undefined,
          category: payload.category ? String(payload.category) : undefined,
        });
        this.post({ type: PRACTICE_MESSAGES.BOOKMARKS_LOADED, payload: { bookmarks } });
        break;
      }

      case PRACTICE_MESSAGES.GET_PROGRESS: {
        this.post({
          type: PRACTICE_MESSAGES.PROGRESS_LOADED,
          payload: this.service.getProgress(),
        });
        break;
      }

      case PRACTICE_MESSAGES.RESET_PROGRESS: {
        this.service.reset();
        this.post({
          type: PRACTICE_MESSAGES.PROGRESS_LOADED,
          payload: this.service.getProgress(),
        });
        break;
      }

      case PRACTICE_MESSAGES.EXPORT_PROGRESS: {
        const json = this.service.exportJson();
        const document = await vscode.workspace.openTextDocument({
          content: json,
          language: 'json',
        });
        await vscode.window.showTextDocument(document);
        break;
      }

      case PRACTICE_MESSAGES.IMPORT_PROGRESS: {
        const result = this.service.importJson(String(payload.json ?? ''));
        if (!result.imported) {
          void vscode.window.showWarningMessage(
            `The learning data could not be imported: ${result.error ?? 'unknown reason'}`
          );
        }
        this.post({
          type: PRACTICE_MESSAGES.PROGRESS_LOADED,
          payload: this.service.getProgress(),
        });
        break;
      }

      case PRACTICE_MESSAGES.RECORD_ALGORITHM_EXPLORED: {
        this.service.recordAlgorithmExplored(String(payload.algorithmId ?? ''));
        break;
      }

      default:
        break;
      }
    } catch (error) {
      this.post({
        type: PRACTICE_MESSAGES.PRACTICE_ERROR,
        payload: { message: error instanceof Error ? error.message : String(error) },
      });
    }
  }
}
