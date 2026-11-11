import type {
  AIQuestionDraft,
  AIQuestionRequest,
  AIProviderId,
} from './types';

/**
 * The review workflow for generated questions.
 *
 * A generated question is **never** part of the verified question bank. It
 * stays a draft until the student reviewed it:
 *
 * 1. the assistant proposes questions,
 * 2. the structural validation runs (structure, answer availability,
 *    explanation, duplicate check against the verified bank),
 * 3. the student approves or rejects every draft with a note,
 * 4. only an approved draft may be used in a quiz.
 *
 * The drafts live in their own store, so the verified bank of Phase 6 stays
 * untouched — the "reviewed" flag is what makes a question usable, not the
 * place it happens to live in.
 */

export interface QuestionDraftStore {
  read(): AIQuestionDraft[];
  write(drafts: AIQuestionDraft[]): void;
}

/** The problems that can make a draft unusable. */
export type DraftIssueKind =
  | 'missing-title'
  | 'missing-question'
  | 'missing-answer'
  | 'missing-explanation'
  | 'short-explanation'
  | 'answer-not-in-options'
  | 'too-few-options'
  | 'duplicate'
  | 'unknown-type';

export interface DraftIssue {
  kind: DraftIssueKind;
  message: string;
}

const QUESTION_TYPES: AIQuestionDraft['type'][] = [
  'mcq',
  'multiple-select',
  'true-false',
  'fill-blank',
  'code-output',
  'find-error',
  'complexity',
  'short-answer',
];

/** The types that need answer options. */
const TYPES_WITH_OPTIONS: AIQuestionDraft['type'][] = [
  'mcq',
  'multiple-select',
  'true-false',
  'code-output',
  'complexity',
];

/** The minimum length of an explanation that justifies an answer. */
const MINIMUM_EXPLANATION_LENGTH = 20;

let counter = 0;

/** Builds a stable id for a draft. */
function draftId(): string {
  counter += 1;
  return `draft-${Date.now().toString(36)}-${counter}`;
}

/** The normalised text of a question — used for the duplicate check. */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export class QuestionDraftService {
  constructor(private readonly store: QuestionDraftStore) {}

  /** All drafts of the student. */
  list(): AIQuestionDraft[] {
    return this.store.read() ?? [];
  }

  /** The drafts that are still waiting for a decision. */
  listPending(): AIQuestionDraft[] {
    return this.list().filter((draft) => draft.status === 'pending');
  }

  /** The drafts the student approved. */
  listApproved(): AIQuestionDraft[] {
    return this.list().filter((draft) => draft.status === 'approved');
  }

  /**
   * Validates a proposed question.
   * Returns the problems — an empty list means the draft is usable.
   */
  validate(
    candidate: Partial<AIQuestionDraft>,
    existingTexts: string[] = []
  ): DraftIssue[] {
    const issues: DraftIssue[] = [];

    if (!candidate.title || !candidate.title.trim()) {
      issues.push({ kind: 'missing-title', message: 'The question has no title.' });
    }
    if (!candidate.question || !candidate.question.trim()) {
      issues.push({ kind: 'missing-question', message: 'The question text is missing.' });
    }

    const answer = candidate.correctAnswer;
    const hasAnswer =
      (typeof answer === 'string' && answer.trim().length > 0) ||
      (Array.isArray(answer) && answer.length > 0 && answer.some((entry) => String(entry).trim().length > 0));
    if (!hasAnswer) {
      issues.push({ kind: 'missing-answer', message: 'The question has no answer.' });
    }

    const explanation = candidate.explanation ?? '';
    if (!explanation.trim()) {
      issues.push({ kind: 'missing-explanation', message: 'The question has no explanation.' });
    } else if (explanation.trim().length < MINIMUM_EXPLANATION_LENGTH) {
      issues.push({
        kind: 'short-explanation',
        message: `The explanation is too short — at least ${MINIMUM_EXPLANATION_LENGTH} characters are needed.`,
      });
    }

    if (candidate.type && !QUESTION_TYPES.includes(candidate.type)) {
      issues.push({
        kind: 'unknown-type',
        message: `Unknown question type "${candidate.type}".`,
      });
    }

    if (candidate.type && TYPES_WITH_OPTIONS.includes(candidate.type)) {
      const options = candidate.options ?? [];
      if (options.length < 2) {
        issues.push({
          kind: 'too-few-options',
          message: 'A choice question needs at least two options.',
        });
      } else {
        const answers = Array.isArray(answer) ? answer : [answer];
        for (const entry of answers) {
          if (typeof entry === 'string' && entry.trim().length > 0 && !options.includes(entry)) {
            issues.push({
              kind: 'answer-not-in-options',
              message: `The answer "${entry}" is not among the options.`,
            });
          }
        }
      }
    }

    if (candidate.question) {
      const normalized = normalizeText(candidate.question);
      const duplicate = existingTexts.some(
        (text) => normalizeText(text) === normalized
      );
      if (duplicate) {
        issues.push({
          kind: 'duplicate',
          message: 'An identical question already exists.',
        });
      }
    }

    return issues;
  }

  /**
   * Adds the proposed questions as drafts.
   *
   * The questions that fail the validation are not stored as usable drafts —
   * they are returned with their problems so that the student sees why.
   */
  add(
    candidates: Array<Partial<AIQuestionDraft>>,
    provider: AIProviderId,
    request: AIQuestionRequest = {}
  ): { drafts: AIQuestionDraft[]; rejected: Array<{ candidate: Partial<AIQuestionDraft>; issues: DraftIssue[] }> } {
    const existing = this.list();
    const existingTexts = existing.map((draft) => draft.question);
    const drafts: AIQuestionDraft[] = [];
    const rejected: Array<{ candidate: Partial<AIQuestionDraft>; issues: DraftIssue[] }> = [];

    for (const candidate of candidates) {
      const issues = this.validate(candidate, existingTexts);

      if (issues.length > 0) {
        rejected.push({ candidate, issues });
        continue;
      }

      const draft: AIQuestionDraft = {
        id: draftId(),
        title: candidate.title!.trim(),
        category: candidate.category ?? request.topic ?? 'general',
        topic: candidate.topic ?? request.topic ?? candidate.category ?? 'general',
        difficulty: candidate.difficulty ?? request.difficulty ?? 'intermediate',
        type: candidate.type ?? 'short-answer',
        question: candidate.question!.trim(),
        options: candidate.options,
        correctAnswer: candidate.correctAnswer!,
        explanation: candidate.explanation!.trim(),
        tags: candidate.tags ?? [],
        code: candidate.code,
        provider,
        createdAt: Date.now(),
        status: 'pending',
        issues: [],
      };

      drafts.push(draft);
      existingTexts.push(draft.question);
    }

    if (drafts.length > 0) {
      this.store.write([...existing, ...drafts]);
    }

    return { drafts, rejected };
  }

  /** Approves a draft — it may now be used in a quiz. */
  approve(draftIdValue: string): AIQuestionDraft | undefined {
    return this.update(draftIdValue, { status: 'approved', reviewedAt: Date.now() });
  }

  /** Rejects a draft with a note. */
  reject(draftIdValue: string, note?: string): AIQuestionDraft | undefined {
    return this.update(draftIdValue, {
      status: 'rejected',
      reviewedAt: Date.now(),
      reviewNote: note,
    });
  }

  /** Removes a draft. */
  remove(draftIdValue: string): boolean {
    const drafts = this.list();
    const remaining = drafts.filter((draft) => draft.id !== draftIdValue);
    if (remaining.length === drafts.length) {
      return false;
    }
    this.store.write(remaining);
    return true;
  }

  /** Removes every rejected draft. */
  clearRejected(): number {
    const drafts = this.list();
    const remaining = drafts.filter((draft) => draft.status !== 'rejected');
    const removed = drafts.length - remaining.length;
    if (removed > 0) {
      this.store.write(remaining);
    }
    return removed;
  }

  private update(
    draftIdValue: string,
    changes: Partial<AIQuestionDraft>
  ): AIQuestionDraft | undefined {
    const drafts = this.list();
    const index = drafts.findIndex((draft) => draft.id === draftIdValue);
    if (index === -1) {
      return undefined;
    }

    const updated: AIQuestionDraft = { ...drafts[index], ...changes };
    drafts[index] = updated;
    this.store.write(drafts);
    return updated;
  }
}
