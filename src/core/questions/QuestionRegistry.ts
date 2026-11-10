import { FUNDAMENTAL_QUESTIONS } from './fundamentals';
import { SEARCHING_QUESTIONS } from './algorithms';
import { GRAPH_QUESTIONS } from './graphs';
import { CODE_EXERCISE_QUESTIONS } from './code-exercises';
import type { Question, QuestionFilter } from '../practice/types';

/**
 * The central question bank.
 *
 * Every question is bundled with the extension, so practice works completely
 * offline. The bank is filtered in memory — there is no loading step and no
 * network access.
 */

export const ALL_QUESTIONS: Question[] = [
  ...FUNDAMENTAL_QUESTIONS,
  ...SEARCHING_QUESTIONS,
  ...GRAPH_QUESTIONS,
  ...CODE_EXERCISE_QUESTIONS,
];

const QUESTION_INDEX = new Map(ALL_QUESTIONS.map((question) => [question.id, question]));

/** Returns a question by id. */
export function getQuestionById(id: string): Question | undefined {
  return QUESTION_INDEX.get(id);
}

/** All categories that occur in the bank. */
export function getQuestionCategories(): string[] {
  return [...new Set(ALL_QUESTIONS.map((question) => question.category))].sort();
}

/** All topics that occur in the bank. */
export function getQuestionTopics(): string[] {
  return [...new Set(ALL_QUESTIONS.map((question) => question.topic))].sort();
}

/** Filters the question bank. */
export function filterQuestions(filter: QuestionFilter = {}): Question[] {
  let questions = ALL_QUESTIONS;

  if (filter.ids && filter.ids.length > 0) {
    const allowed = new Set(filter.ids);
    questions = questions.filter((question) => allowed.has(question.id));
  }
  if (filter.category) {
    questions = questions.filter((question) => question.category === filter.category);
  }
  if (filter.topic) {
    questions = questions.filter((question) => question.topic === filter.topic);
  }
  if (filter.difficulty) {
    questions = questions.filter((question) => question.difficulty === filter.difficulty);
  }
  if (filter.type) {
    questions = questions.filter((question) => question.type === filter.type);
  }
  if (filter.algorithmId) {
    questions = questions.filter((question) => question.algorithmId === filter.algorithmId);
  }

  if (filter.limit !== undefined && filter.limit > 0) {
    questions = questions.slice(0, filter.limit);
  }

  return questions;
}

export interface QuestionValidationIssue {
  questionId: string;
  problem: string;
}

/**
 * Validates the question bank.
 *
 * The checks make sure that every question is answerable: a choice question
 * must offer its correct answer as an option, a fill-in question must have a
 * non-empty answer, and a find-the-error question must point at real lines of
 * its snippet.
 */
export function validateQuestionBank(questions: Question[] = ALL_QUESTIONS): QuestionValidationIssue[] {
  const issues: QuestionValidationIssue[] = [];
  const seen = new Set<string>();

  for (const question of questions) {
    if (seen.has(question.id)) {
      issues.push({ questionId: question.id, problem: 'Duplicate question id.' });
    }
    seen.add(question.id);

    if (!question.id || !question.title || !question.question) {
      issues.push({ questionId: question.id, problem: 'Missing id, title or question text.' });
    }

    if (!question.explanation || question.explanation.length < 20) {
      issues.push({ questionId: question.id, problem: 'The explanation is missing or too short.' });
    }

    if (!question.category || !question.topic) {
      issues.push({ questionId: question.id, problem: 'Missing category or topic.' });
    }

    const needsOptions =
      question.type === 'mcq' ||
      question.type === 'multiple-select' ||
      question.type === 'true-false' ||
      question.type === 'code-output' ||
      question.type === 'complexity';

    if (needsOptions) {
      if (!question.options || question.options.length < 2) {
        issues.push({ questionId: question.id, problem: 'A choice question needs at least two options.' });
      } else {
        const answers = Array.isArray(question.correctAnswer)
          ? question.correctAnswer
          : [question.correctAnswer];
        for (const answer of answers) {
          if (!question.options.includes(answer)) {
            issues.push({
              questionId: question.id,
              problem: `The correct answer "${answer}" is not among the options.`,
            });
          }
        }
      }
    }

    if (question.type === 'multiple-select') {
      const answers = question.correctAnswer;
      if (!Array.isArray(answers) || answers.length < 2) {
        issues.push({
          questionId: question.id,
          problem: 'A multiple-select question needs at least two correct answers.',
        });
      }
    }

    if (question.type === 'find-error') {
      if (!question.code) {
        issues.push({ questionId: question.id, problem: 'A find-the-error question needs a code snippet.' });
      }
      if (!question.errorLines || question.errorLines.length === 0) {
        issues.push({
          questionId: question.id,
          problem: 'A find-the-error question must mark the erroneous line(s).',
        });
      }
      if (!question.correctedCode) {
        issues.push({
          questionId: question.id,
          problem: 'A find-the-error question needs the corrected implementation.',
        });
      }
    }

    if (question.type === 'code-output' && !question.code) {
      issues.push({ questionId: question.id, problem: 'A code-output question needs a code snippet.' });
    }
  }

  return issues;
}
