import type { AssessmentResult, AssessmentType } from '../practice/types';

/**
 * The assessment engine.
 *
 * It turns the results of the different assessment types into one common
 * result model, so the progress dashboard can compare them. The scoring rules
 * are always explicit.
 */

export interface AssessmentInput {
  type: AssessmentType;
  title: string;
  category?: string;
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  negativeMarking?: number;
  passed?: boolean;
  passingScore?: number;
  durationSeconds: number;
  topicBreakdown?: Record<string, { correct: number; total: number }>;
  detail?: string;
  completedAt?: number;
}

/** Builds the common assessment result. */
export function buildAssessmentResult(input: AssessmentInput): AssessmentResult {
  const answered = input.correct + input.incorrect + input.unanswered;
  const accuracy = answered > 0 ? (input.correct / answered) * 100 : 0;

  return {
    id: `assessment-${input.completedAt ?? Date.now().toString(36)}`,
    type: input.type,
    title: input.title,
    category: input.category,
    completedAt: input.completedAt ?? Date.now(),
    durationSeconds: input.durationSeconds,
    score: input.score,
    maxScore: input.maxScore,
    accuracy: Math.round(accuracy * 10) / 10,
    correct: input.correct,
    incorrect: input.incorrect,
    unanswered: input.unanswered,
    negativeMarking: input.negativeMarking ?? 0,
    passed: input.passed,
    passingScore: input.passingScore,
    topicBreakdown: input.topicBreakdown ?? {},
    detail: input.detail,
  };
}

/** The topics that should be revised after an assessment. */
export function recommendedRevisionTopics(result: AssessmentResult): string[] {
  return Object.entries(result.topicBreakdown)
    .filter(([, stats]) => stats.correct < stats.total)
    .map(([topic, stats]) => ({ topic, stats }))
    .sort((a, b) => a.stats.correct / a.stats.total - b.stats.correct / b.stats.total)
    .map((entry) => `${entry.topic} (${entry.stats.correct}/${entry.stats.total})`);
}

/** A human readable description of the scoring rules of a result. */
export function describeAssessmentScoring(result: AssessmentResult): string {
  const base = `${result.score} of ${result.maxScore} marks`;
  if (result.negativeMarking > 0) {
    return `${base} — every wrong answer cost ${result.negativeMarking} mark${result.negativeMarking === 1 ? '' : 's'}.`;
  }
  return `${base} — no negative marking was applied.`;
}

/** The average accuracy of a list of assessments. */
export function averageAccuracy(results: AssessmentResult[]): number {
  if (results.length === 0) {
    return 0;
  }
  const total = results.reduce((sum, result) => sum + result.accuracy, 0);
  return Math.round((total / results.length) * 10) / 10;
}
