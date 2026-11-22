import { ACHIEVEMENTS } from './AchievementRegistry';
import { getQuestionById } from '../questions/QuestionRegistry';
import type { Achievement, EarnedAchievement, LearningData, LearningStatistics } from '../practice/types';

/**
 * The achievement system.
 *
 * An achievement is granted only when its criteria are actually satisfied —
 * the numbers come from the recorded learning data, never from a counter that
 * could drift.
 */
export class AchievementService {
  /** The achievements whose criteria are met by the given data. */
  evaluate(data: LearningData): EarnedAchievement[] {
    const earned: EarnedAchievement[] = [];
    const already = new Set(data.achievements.map((entry) => entry.id));

    for (const achievement of ACHIEVEMENTS) {
      if (already.has(achievement.id)) {
        continue;
      }
      if (this.isSatisfied(achievement, data)) {
        earned.push({ id: achievement.id, earnedAt: Date.now() });
      }
    }

    return earned;
  }

  /** True when the criteria of the achievement are met. */
  isSatisfied(achievement: Achievement, data: LearningData): boolean {
    const { metric, threshold, category } = achievement.criteria;
    const statistics = data.statistics;

    switch (metric) {
    case 'algorithmsExplored':
      return statistics.algorithmsExplored >= threshold;
    case 'quizzesCompleted':
      return statistics.quizzesCompleted >= threshold;
    case 'challengesSolved':
      return statistics.challengesAccepted >= threshold;
    case 'challengesAccepted':
      return statistics.challengesAccepted >= threshold;
    case 'questionsAnswered':
      return statistics.questionsAnswered >= threshold;
    case 'topicsExplored':
      return statistics.topicsExplored >= threshold;
    case 'practicalsCompleted':
      return statistics.practicalsCompleted >= threshold;
    case 'categoryChallengesAccepted':
      return countAcceptedInCategory(data, category) >= threshold;
    case 'categoryCorrectAnswers':
      return countCorrectInCategory(data, category) >= threshold;
    default:
      return false;
    }
  }
}

function countAcceptedInCategory(data: LearningData, category?: string): number {
  if (!category) {
    return 0;
  }
  return data.submissions.filter(
    (submission) => submission.status === 'accepted' && submission.challengeCategory === category
  ).length;
}

function countCorrectInCategory(data: LearningData, category?: string): number {
  if (!category) {
    return 0;
  }

  let total = 0;
  for (const [questionId, count] of Object.entries(data.correctAnswers)) {
    const question = getQuestionById(questionId);
    if (!question) {
      continue;
    }
    // The "complexity" achievement counts the complexity exercises, every
    // other achievement counts the questions of a category.
    const matches =
      category === 'complexity' ? question.type === 'complexity' : question.category === category;
    if (matches) {
      total += count;
    }
  }
  return total;
}

/** Recomputes the learning statistics from the recorded data. */
export function computeStatistics(data: LearningData): LearningStatistics {
  const completedAttempts = data.quizAttempts.filter((attempt) => attempt.status === 'completed');
  const accuracyTotal = completedAttempts.reduce((sum, attempt) => sum + (attempt.accuracy ?? 0), 0);

  const questionsAnswered = Object.entries(data.correctAnswers).reduce(
    (sum, [, count]) => sum + count,
    0
  ) + Object.entries(data.wrongAnswers).reduce((sum, [, count]) => sum + count, 0);

  const questionsCorrect = Object.values(data.correctAnswers).reduce(
    (sum, count) => sum + count,
    0
  );

  const activityByDay: Record<string, number> = {};
  const recordActivity = (timestamp?: number): void => {
    if (!timestamp) {
      return;
    }
    const day = new Date(timestamp).toISOString().slice(0, 10);
    activityByDay[day] = (activityByDay[day] ?? 0) + 1;
  };

  for (const attempt of completedAttempts) {
    recordActivity(attempt.completedAt);
  }
  for (const submission of data.submissions) {
    recordActivity(submission.submittedAt);
  }
  for (const session of data.practicalSessions) {
    recordActivity(session.completedAt);
  }

  return {
    algorithmsExplored: data.exploredAlgorithms.length,
    quizzesCompleted: completedAttempts.length,
    quizAccuracyTotal: completedAttempts.length > 0 ? accuracyTotal / completedAttempts.length : 0,
    challengesAttempted: data.submissions.length,
    challengesAccepted: data.submissions.filter((submission) => submission.status === 'accepted').length,
    questionsAnswered,
    questionsCorrect,
    topicsExplored: Object.values(data.topicProgress).filter((topic) => topic.explored).length,
    practicalsCompleted: data.practicalSessions.filter((session) => session.status === 'completed').length,
    totalSessions:
      completedAttempts.length + data.submissions.length + data.practicalSessions.length,
    activityByDay,
  };
}
