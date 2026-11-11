import type * as vscode from 'vscode';
import { QuestionDraftService } from '../../core/ai/QuestionDraftService';
import type { AIQuestionDraft } from '../../core/ai/types';
import type { Question } from '../../core/practice/types';

/**
 * The store of the reviewed questions.
 *
 * The approved drafts of the student are the only ones that may be used in a
 * quiz. They live in their own store — the verified question bank of Phase 6
 * is never modified, and a draft that was not approved never reaches a quiz.
 */
export class ApprovedQuestionService {
  readonly drafts: QuestionDraftService;

  constructor(context: vscode.ExtensionContext) {
    this.drafts = new QuestionDraftService({
      read: () => context.globalState.get('daa.ai.questionDrafts') ?? [],
      write: (drafts: AIQuestionDraft[]) => {
        void context.globalState.update('daa.ai.questionDrafts', drafts);
      },
    });
  }

  /** The approved drafts as questions of the practice centre. */
  getQuestions(): Question[] {
    return this.drafts.listApproved().map((draft) => ({
      id: draft.id,
      title: draft.title,
      category: draft.category,
      topic: draft.topic,
      difficulty: draft.difficulty,
      type: draft.type,
      question: draft.question,
      options: draft.options,
      correctAnswer: draft.correctAnswer,
      explanation: draft.explanation,
      tags: [...draft.tags, 'ai-generated', 'reviewed'],
      code: draft.code,
    }));
  }
}
