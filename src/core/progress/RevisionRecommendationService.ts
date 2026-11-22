import { getQuestionById } from '../questions/QuestionRegistry';
import { getChallengeById } from '../challenges/ChallengeRegistry';
import { analyzePerformance } from './PerformanceAnalyzer';
import { TOPICS } from './TopicProgressTracker';
import type { LearningData, RevisionRecommendation } from '../practice/types';

/**
 * Rule based revision recommendations.
 *
 * Every recommendation carries the rule that produced it, so the student can
 * see why it is suggested. The order follows the priority list of the phase
 * specification.
 */
export function buildRecommendations(data: LearningData): RevisionRecommendation[] {
  const recommendations: RevisionRecommendation[] = [];
  const performance = analyzePerformance(data);

  // 1. Repeatedly incorrect concepts.
  for (const mistake of performance.frequentMistakes) {
    const question = getQuestionById(mistake.questionId);
    recommendations.push({
      id: `rec-question-${mistake.questionId}`,
      title: `Revise “${mistake.title}”`,
      reason: `You answered this question wrong ${mistake.wrongCount} times.`,
      priority: 1,
      kind: 'question',
      targetId: mistake.questionId,
    });
    void question;
  }

  // 2. Incomplete topics.
  for (const topic of TOPICS) {
    const progress = data.topicProgress[topic.id];
    if (progress && !progress.completed) {
      recommendations.push({
        id: `rec-topic-${topic.id}`,
        title: `Finish the topic “${topic.label}”`,
        reason: `${progress.correctAnswers} of the questions of this topic were answered correctly so far.`,
        priority: 2,
        kind: 'topic',
        targetId: topic.id,
      });
    }
  }

  // 3. Weak topics.
  for (const topic of performance.weakTopics) {
    recommendations.push({
      id: `rec-weak-${topic.topicId}`,
      title: `Review “${topic.label}”`,
      reason: `Your accuracy in this topic is ${topic.accuracy} % (${topic.correct} of ${topic.attempted} questions correct).`,
      priority: 3,
      kind: 'topic',
      targetId: topic.topicId,
    });
  }

  // 4. Bookmarked questions.
  for (const bookmark of data.bookmarks.filter((entry) => entry.kind === 'question')) {
    recommendations.push({
      id: `rec-bookmark-${bookmark.itemId}`,
      title: `Revisit the bookmark “${bookmark.title}”`,
      reason: 'You marked this question as difficult.',
      priority: 4,
      kind: 'question',
      targetId: bookmark.itemId,
    });
  }

  // 5. Coding challenges that were never solved.
  const failedChallenges = new Map<string, number>();
  for (const submission of data.submissions) {
    if (submission.status === 'accepted') {
      continue;
    }
    failedChallenges.set(submission.challengeId, (failedChallenges.get(submission.challengeId) ?? 0) + 1);
  }
  for (const [challengeId, attempts] of failedChallenges) {
    const challenge = getChallengeById(challengeId);
    recommendations.push({
      id: `rec-challenge-${challengeId}`,
      title: `Solve “${challenge?.title ?? challengeId}”`,
      reason: `You submitted a solution ${attempts} time${attempts === 1 ? '' : 's'} without passing every test case.`,
      priority: 5,
      kind: 'challenge',
      targetId: challengeId,
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}

/**
 * The recommendation that points at the Complexity Analyzer.
 * It is used when the complexity questions are the weak spot.
 */
export function buildComplexityRecommendation(data: LearningData): RevisionRecommendation | null {
  const complexityQuestions = [
    'fund-004',
    'dc-002',
    'dc-003',
    'dc-005',
    'dp-002',
    'cx-001',
    'cx-002',
    'cx-003',
    'cx-004',
    'cx-005',
  ];
  const wrong = complexityQuestions.reduce(
    (sum, id) => sum + (data.wrongAnswers[id] ?? 0),
    0
  );
  const correct = complexityQuestions.reduce(
    (sum, id) => sum + (data.correctAnswers[id] ?? 0),
    0
  );

  if (wrong < 2 || correct >= wrong) {
    return null;
  }

  return {
    id: 'rec-complexity-analyzer',
    title: 'Practise with the Complexity Analyzer',
    reason: `You answered ${wrong} complexity questions wrongly — the instrumented operation counter shows how many comparisons an algorithm really performs.`,
    priority: 2,
    kind: 'resource',
    targetId: 'complexity-analyzer',
  };
}
