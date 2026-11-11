import type { AIQuestionDraft } from './types';

/**
 * Parses the questions out of an answer of a provider.
 *
 * The tutor prompt asks for JSON, but a model does not always obey it
 * exactly: the JSON may be wrapped in a code fence, surrounded by an
 * explanation, or use single quotes. The parser therefore finds the JSON
 * array inside the text and accepts both quote styles.
 *
 * A question that cannot be parsed is never silently dropped: it is
 * reported so that the student sees that the count did not add up.
 */

export interface ParsedQuestion {
  candidate: Partial<AIQuestionDraft>;
  /** The problems that were found while parsing. */
  issues: string[];
}

/** Extracts the JSON array of the answer. */
export function extractJsonArray(text: string): string | undefined {
  const withoutFence = text.replace(/```(?:json)?/gi, '');

  const start = withoutFence.indexOf('[');
  if (start === -1) {
    return undefined;
  }

  // Walk the text and remember the last balanced bracket — this tolerates
  // brackets inside the strings.
  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;

  for (let i = start; i < withoutFence.length; i += 1) {
    const character = withoutFence[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === '\\') {
      escaped = true;
      continue;
    }

    if (inString) {
      if (character === quote) {
        inString = false;
      }
      continue;
    }

    if (character === '"' || character === '\'') {
      inString = true;
      quote = character;
      continue;
    }

    if (character === '[') {
      depth += 1;
    } else if (character === ']') {
      depth -= 1;
      if (depth === 0) {
        return withoutFence.slice(start, i + 1);
      }
    }
  }

  return undefined;
}

/** Parses a JSON text with a tolerant parser. */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Retry with single quotes converted to double quotes.
    const repaired = text.replace(/'/g, '"');
    try {
      return JSON.parse(repaired);
    } catch {
      return undefined;
    }
  }
}

/**
 * Reads the questions out of an answer of the provider.
 * Every entry becomes a candidate with its problems — the validation of the
 * draft service decides whether it may be used.
 */
export function parseGeneratedQuestions(text: string): ParsedQuestion[] {
  const json = extractJsonArray(text);
  if (!json) {
    return [];
  }

  const parsed = parseJson(json);
  if (!Array.isArray(parsed)) {
    return [];
  }

  const results: ParsedQuestion[] = [];

  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const candidate: Partial<AIQuestionDraft> = {};

    if (typeof record.title === 'string') {
      candidate.title = record.title;
    }
    if (typeof record.question === 'string') {
      candidate.question = record.question;
    }
    if (typeof record.explanation === 'string') {
      candidate.explanation = record.explanation;
    }
    if (typeof record.topic === 'string') {
      candidate.topic = record.topic;
    }
    if (typeof record.category === 'string') {
      candidate.category = record.category;
    }
    if (typeof record.code === 'string') {
      candidate.code = record.code;
    }
    if (typeof record.type === 'string') {
      candidate.type = record.type as AIQuestionDraft['type'];
    }
    if (typeof record.difficulty === 'string') {
      candidate.difficulty = record.difficulty as AIQuestionDraft['difficulty'];
    }
    if (Array.isArray(record.options)) {
      candidate.options = record.options.map((option) => String(option));
    }
    if (Array.isArray(record.correctAnswer)) {
      candidate.correctAnswer = record.correctAnswer.map((answer) => String(answer));
    } else if (typeof record.correctAnswer === 'string') {
      candidate.correctAnswer = record.correctAnswer;
    } else if (typeof record.correct === 'string') {
      candidate.correctAnswer = record.correct;
    }
    if (Array.isArray(record.tags)) {
      candidate.tags = record.tags.map((tag) => String(tag));
    }

    const issues: string[] = [];
    if (!candidate.question) {
      issues.push('The question text is missing.');
    }
    if (candidate.correctAnswer === undefined) {
      issues.push('The question has no answer.');
    }
    if (!candidate.explanation) {
      issues.push('The question has no explanation.');
    }

    results.push({ candidate, issues });
  }

  return results;
}

/**
 * The instruction that asks a provider for questions in the expected format.
 * It is appended to the system prompt of the generation request.
 */
export const QUESTION_GENERATION_INSTRUCTION = `Write the practice questions as a JSON array.

Every entry must be an object with these keys:
{
  "title": "a short title",
  "question": "the question itself",
  "type": "mcq" | "multiple-select" | "true-false" | "fill-blank" | "code-output" | "find-error" | "complexity" | "short-answer",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": "the exact text of the correct option",
  "explanation": "why the answer is right — at least 20 characters",
  "topic": "the topic",
  "category": "the category",
  "difficulty": "beginner" | "intermediate" | "advanced"
}

Rules:
- The answer must be one of the options, character for character.
- The explanation must justify the answer and name the option.
- Use "true-false" only with the options ["True", "False"].
- Answer with the JSON array only — no explanation before or after it.`;
