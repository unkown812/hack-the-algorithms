import type { Question, QuizConfig, QuizQuestion } from '../practice/types';

/**
 * Transparent scoring for quizzes and assessments.
 *
 * The rules are deliberately simple so that a student can always reproduce
 * the score by hand:
 *
 *   marks per question = total marks / number of questions
 *   score = correct · marks − incorrect · negative marking
 *
 * Negative marking is zero unless the assessment configures it.
 */

export interface ScoringPolicy {
  /** Total marks of the assessment. */
  totalMarks: number;
  /** Marks deducted for every wrong answer. */
  negativeMarking: number;
  /** Score needed to pass; undefined means "no pass mark". */
  passingScore?: number;
}

export interface ScoreBreakdown {
  score: number;
  maxScore: number;
  marksPerQuestion: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
  passed?: boolean;
  topicBreakdown: Record<string, { correct: number; total: number }>;
  /** Topics that produced wrong or missing answers. */
  recommendedRevision: string[];
}

export function marksPerQuestion(policy: ScoringPolicy, questionCount: number): number {
  if (questionCount <= 0) {
    return 0;
  }
  return policy.totalMarks / questionCount;
}

/** Calculates the score of a set of answered questions. */
export function scoreQuestions(
  questions: QuizQuestion[],
  policy: ScoringPolicy
): ScoreBreakdown {
  const total = questions.length;
  const perQuestion = marksPerQuestion(policy, total);

  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  const topicBreakdown: Record<string, { correct: number; total: number }> = {};

  for (const entry of questions) {
    const topic = entry.question.topic;
    if (!topicBreakdown[topic]) {
      topicBreakdown[topic] = { correct: 0, total: 0 };
    }
    topicBreakdown[topic].total += 1;

    if (!entry.answered) {
      unanswered += 1;
      continue;
    }
    if (entry.correct) {
      correct += 1;
      topicBreakdown[topic].correct += 1;
    } else {
      incorrect += 1;
    }
  }

  const score = correct * perQuestion - incorrect * policy.negativeMarking;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;

  const recommendedRevision = Object.entries(topicBreakdown)
    .filter(([, stats]) => stats.correct < stats.total)
    .map(([topic, stats]) => `${topic} (${stats.correct}/${stats.total} correct)`)
    .sort();

  const result: ScoreBreakdown = {
    score: Math.round(score * 100) / 100,
    maxScore: policy.totalMarks,
    marksPerQuestion: perQuestion,
    correct,
    incorrect,
    unanswered,
    accuracy: Math.round(accuracy * 10) / 10,
    topicBreakdown,
    recommendedRevision,
  };

  if (policy.passingScore !== undefined) {
    result.passed = score >= policy.passingScore;
  }

  return result;
}

/** Builds the default policy for a quiz configuration. */
export function policyForQuiz(config: QuizConfig, questionCount: number): ScoringPolicy {
  return {
    totalMarks: questionCount,
    negativeMarking: config.negativeMarking ?? 0,
  };
}

/** The explanation of the scoring rules — shown in the quiz UI. */
export function describeScoring(policy: ScoringPolicy, questionCount: number): string {
  const base = `1 mark per question (${questionCount} question${questionCount === 1 ? '' : 's'} → ${policy.totalMarks} marks in total).`;
  if (policy.negativeMarking > 0) {
    return `${base} Every wrong answer costs ${policy.negativeMarking} mark${policy.negativeMarking === 1 ? '' : 's'}. Unanswered questions cost nothing.`;
  }
  return `${base} Wrong and unanswered questions cost nothing — there is no negative marking.`;
}

/** The questions that are wrong or missing, grouped by topic. */
export function revisionTopics(questions: QuizQuestion[]): string[] {
  const topics = new Set<string>();
  for (const entry of questions) {
    if (!entry.correct) {
      topics.add(entry.question.topic);
    }
  }
  return [...topics].sort();
}

/** Convenience helper: the questions of a quiz, in order. */
export function questionsOf(list: QuizQuestion[]): Question[] {
  return list.map((entry) => entry.question);
}
