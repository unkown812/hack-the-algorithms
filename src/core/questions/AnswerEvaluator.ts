import type { Question } from '../practice/types';

/**
 * Evaluates a student's answer.
 *
 * The evaluator is deliberately explicit about what it can and cannot judge:
 * - choice questions are compared against the stored correct answer,
 * - code output is compared after normalising the whitespace,
 * - a find-the-error answer is compared by the selected line number,
 * - free-form answers are *not* judged automatically — the student verifies
 *   their own answer against the expected one, and the evaluator only reports
 *   which keywords were found.
 */

export interface AnswerEvaluation {
  correct: boolean;
  /** True when the student judges the answer themselves. */
  selfAssess: boolean;
  /** Keywords of the expected answer that the student's text contains. */
  matchedKeywords: string[];
  /** Keywords of the expected answer that are missing. */
  missingKeywords: string[];
  /** The explanation shown after the submission. */
  explanation: string;
  /** The normalised answer that was compared. */
  normalizedAnswer: string;
}

/** Collapses whitespace and trims — used for text comparisons. */
export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Normalises a program output for comparison. */
export function normalizeOutput(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n+$/, '')
    .trim();
}

function asArray(answer: string | string[]): string[] {
  return Array.isArray(answer) ? answer : [answer];
}

/**
 * Evaluates an answer for the given question.
 * `answer` may be undefined (the question was not answered).
 */
export function evaluateAnswer(
  question: Question,
  answer: string | string[] | undefined
): AnswerEvaluation {
  const explanation = question.explanation;

  if (answer === undefined || answer === '') {
    return {
      correct: false,
      selfAssess: false,
      matchedKeywords: [],
      missingKeywords: [],
      explanation,
      normalizedAnswer: '',
    };
  }

  switch (question.type) {
  case 'mcq':
  case 'true-false':
  case 'complexity': {
    const given = normalizeText(asArray(answer)[0] ?? '');
    const expected = normalizeText(asArray(question.correctAnswer)[0] ?? '');
    return {
      correct: given === expected,
      selfAssess: false,
      matchedKeywords: [],
      missingKeywords: [],
      explanation,
      normalizedAnswer: given,
    };
  }

  case 'multiple-select': {
    const given = new Set(asArray(answer).map((value) => normalizeText(value)));
    const expected = new Set(asArray(question.correctAnswer).map((value) => normalizeText(value)));
    const correct =
        given.size === expected.size && [...expected].every((value) => given.has(value));
    return {
      correct,
      selfAssess: false,
      matchedKeywords: [],
      missingKeywords: [],
      explanation,
      normalizedAnswer: [...given].sort().join(', '),
    };
  }

  case 'code-output': {
    const given = normalizeOutput(asArray(answer)[0] ?? '');
    const expected = normalizeOutput(asArray(question.correctAnswer)[0] ?? '');
    return {
      correct: given === expected,
      selfAssess: false,
      matchedKeywords: [],
      missingKeywords: [],
      explanation,
      normalizedAnswer: given,
    };
  }

  case 'find-error': {
    const given = asArray(answer)
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);
    const expected = [...(question.errorLines ?? [])].sort((a, b) => a - b);
    const correct =
        given.length === expected.length && given.every((value, index) => value === expected[index]);
    return {
      correct,
      selfAssess: false,
      matchedKeywords: [],
      missingKeywords: [],
      explanation,
      normalizedAnswer: given.join(', '),
    };
  }

  case 'fill-blank': {
    const given = normalizeText(asArray(answer)[0] ?? '');
    // Several spellings may be accepted; they are separated by a pipe.
    const accepted = asArray(question.correctAnswer).flatMap((value) =>
      value.split('|').map((alternative) => normalizeText(alternative))
    );
    return {
      correct: accepted.includes(given),
      selfAssess: false,
      matchedKeywords: [],
      missingKeywords: [],
      explanation,
      normalizedAnswer: given,
    };
  }

  case 'short-answer':
  default: {
    // The answer is not judged automatically — the student compares it with
    // the expected answer. Only the keywords are reported as a help.
    const given = normalizeText(asArray(answer)[0] ?? '');
    const keywords = question.hints ?? [];
    const matched = keywords.filter((keyword) => given.includes(normalizeText(keyword)));
    const missing = keywords.filter((keyword) => !given.includes(normalizeText(keyword)));
    return {
      correct: false,
      selfAssess: true,
      matchedKeywords: matched,
      missingKeywords: missing,
      explanation,
      normalizedAnswer: given,
    };
  }
  }
}

/**
 * Builds a "self assessment" result after the student compared their answer
 * with the expected one.
 */
export function selfAssessResult(question: Question, understood: boolean): AnswerEvaluation {
  return {
    correct: understood,
    selfAssess: true,
    matchedKeywords: understood ? [] : [],
    missingKeywords: [],
    explanation: question.explanation,
    normalizedAnswer: '',
  };
}
