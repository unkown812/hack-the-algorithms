import { filterQuestions } from '../questions/QuestionRegistry';
import { evaluateAnswer } from '../questions/AnswerEvaluator';
import { policyForQuiz, scoreQuestions, type ScoreBreakdown } from './QuizScoringService';
import type {
  PracticeMode,
  Question,
  QuizConfig,
  QuizQuestion,
  QuizResult,
} from '../practice/types';

/**
 * Builds quizzes, tracks the answers and calculates the result.
 *
 * The engine is completely deterministic for a given seed, so a quiz can be
 * reproduced — for example after an extension reload.
 */

/** A small, deterministic pseudo random generator (mulberry32). */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shuffles a list with the given seed. */
export function shuffle<T>(items: T[], seed: number): T[] {
  const random = createRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface BuildQuizOptions {
  /** Overrides the random seed, so a quiz can be reproduced. */
  seed?: number;
  /** Question ids that must not be used (for revision mode). */
  excludeIds?: string[];
  /** Question ids that should be preferred (for revision mode). */
  preferIds?: string[];
  /** Only these question types are used. */
  types?: Question['type'][];
}

export interface BuiltQuiz {
  config: QuizConfig;
  questions: Question[];
  seed: number;
}

/**
 * Selects the questions of a quiz.
 *
 * Revision mode prefers questions that were answered incorrectly before and
 * fills the remaining slots with the questions that were never attempted.
 */
export function buildQuiz(config: QuizConfig, options: BuildQuizOptions = {}): BuiltQuiz {
  const seed = options.seed ?? hashString(config.id + config.questionCount);

  const candidates = filterQuestions({
    category: config.category,
    topic: config.topic,
    difficulty: config.difficulty,
    type: options.types?.[0],
    ids: options.types
      ? undefined
      : undefined,
  }).filter((question) => !options.excludeIds?.includes(question.id));

  const typed = options.types
    ? candidates.filter((question) => options.types!.includes(question.type))
    : candidates;

  const preferred = options.preferIds
    ? typed.filter((question) => options.preferIds!.includes(question.id))
    : [];

  const rest = typed.filter((question) => !options.preferIds?.includes(question.id));

  const selected = [...shuffle(preferred, seed), ...shuffle(rest, seed + 1)].slice(
    0,
    Math.max(0, config.questionCount)
  );

  return { config, questions: selected, seed };
}

/** A stable hash for strings — used to derive reproducible seeds. */
export function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Creates the working state of a quiz. */
export function createQuizQuestions(questions: Question[]): QuizQuestion[] {
  return questions.map((question) => ({
    question,
    answered: false,
    correct: false,
    marks: 0,
    marked: false,
  }));
}

/** Records an answer and judges it immediately (learning mode). */
export function applyAnswer(
  entry: QuizQuestion,
  answer: string | string[],
  mode: PracticeMode
): QuizQuestion {
  const evaluation = evaluateAnswer(entry.question, answer);
  return {
    ...entry,
    answer,
    answered: true,
    // In test mode the answer is only judged when the quiz is submitted.
    correct: mode === 'test' ? false : evaluation.correct,
    marks: 0,
  };
}

/** Marks a question for review. */
export function toggleMark(entry: QuizQuestion): QuizQuestion {
  return { ...entry, marked: !entry.marked };
}

/**
 * Submits the quiz: every answer is judged and the score is calculated.
 */
export function submitQuiz(
  config: QuizConfig,
  entries: QuizQuestion[],
  startedAt: number,
  completedAt: number
): QuizResult {
  const judged = entries.map((entry) => {
    const evaluation = evaluateAnswer(entry.question, entry.answer);
    return {
      ...entry,
      answered: entry.answer !== undefined && entry.answer !== '',
      correct: evaluation.correct,
      marks: evaluation.correct ? 1 : 0,
    };
  });

  const policy = policyForQuiz(config, judged.length);
  const breakdown: ScoreBreakdown = scoreQuestions(judged, policy);

  return {
    attempt: {
      id: `attempt-${startedAt.toString(36)}`,
      quizId: config.id,
      quizTitle: config.title,
      mode: config.mode,
      startedAt,
      completedAt,
      status: 'completed',
      answers: Object.fromEntries(
        judged.filter((entry) => entry.answer !== undefined).map((entry) => [entry.question.id, entry.answer!])
      ),
      questionIds: judged.map((entry) => entry.question.id),
      markedQuestionIds: judged.filter((entry) => entry.marked).map((entry) => entry.question.id),
      score: breakdown.score,
      maxScore: breakdown.maxScore,
      accuracy: breakdown.accuracy,
      correctCount: breakdown.correct,
      incorrectCount: breakdown.incorrect,
      unansweredCount: breakdown.unanswered,
      durationSeconds: Math.round((completedAt - startedAt) / 1000),
      topicBreakdown: breakdown.topicBreakdown,
    },
    questions: judged,
    correctCount: breakdown.correct,
    incorrectCount: breakdown.incorrect,
    unansweredCount: breakdown.unanswered,
    score: breakdown.score,
    maxScore: breakdown.maxScore,
    accuracy: breakdown.accuracy,
    durationSeconds: Math.round((completedAt - startedAt) / 1000),
    topicBreakdown: breakdown.topicBreakdown,
    recommendedRevision: breakdown.recommendedRevision,
  };
}

/** The suggested quiz presets of the practice centre. */
export const QUIZ_PRESETS: QuizConfig[] = [
  {
    id: 'preset-quick',
    title: 'Quick Quiz',
    questionCount: 5,
    mode: 'learning',
    description: 'Five questions for a fast warm-up.',
  },
  {
    id: 'preset-topic',
    title: 'Topic Quiz',
    questionCount: 10,
    mode: 'learning',
    description: 'Ten questions on one topic.',
  },
  {
    id: 'preset-standard',
    title: 'Standard Assessment',
    questionCount: 20,
    mode: 'test',
    description: 'Twenty questions without feedback until the end.',
  },
  {
    id: 'preset-comprehensive',
    title: 'Comprehensive Assessment',
    questionCount: 30,
    mode: 'test',
    description: 'Thirty questions across every topic.',
  },
];

/** Creates a custom quiz configuration. */
export function createCustomQuiz(
  options: {
    title: string;
    questionCount: number;
    category?: string;
    difficulty?: QuizConfig['difficulty'];
    durationSeconds?: number;
    mode: PracticeMode;
    types?: QuizConfig['types'];
    topic?: string;
  }
): QuizConfig {
  return {
    id: `custom-${hashString(options.title + options.questionCount + (options.category ?? ''))}`,
    title: options.title,
    questionCount: options.questionCount,
    category: options.category,
    difficulty: options.difficulty,
    durationSeconds: options.durationSeconds,
    mode: options.mode,
    types: options.types,
    topic: options.topic,
    negativeMarking: 0,
  };
}
