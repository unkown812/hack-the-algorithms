import { ALL_QUESTIONS } from '../questions/QuestionRegistry';
import type { LearningData, TopicProgress } from '../practice/types';

/**
 * Tracks the learning progress per topic.
 *
 * All rules are transparent and computed from the recorded attempts — no
 * opaque score is involved, and a topic is never called "weak" because of a
 * single wrong answer.
 */

export interface TopicDefinition {
  id: string;
  label: string;
  category: string;
}

/** The topics the progress dashboard shows. */
export const TOPICS: TopicDefinition[] = [
  { id: 'fundamentals', label: 'Algorithm Fundamentals', category: 'fundamentals' },
  { id: 'searching', label: 'Searching Algorithms', category: 'searching' },
  { id: 'sorting', label: 'Sorting Algorithms', category: 'sorting' },
  { id: 'greedy', label: 'Greedy Algorithms', category: 'greedy' },
  { id: 'divide-and-conquer', label: 'Divide and Conquer', category: 'divide-and-conquer' },
  { id: 'dynamic-programming', label: 'Dynamic Programming', category: 'dynamic-programming' },
  { id: 'graph', label: 'Graph Algorithms', category: 'graph' },
  { id: 'backtracking', label: 'Backtracking', category: 'backtracking' },
  { id: 'branch-and-bound', label: 'Branch and Bound', category: 'branch-and-bound' },
  { id: 'string-matching', label: 'String Matching', category: 'string-matching' },
];

const TOPIC_INDEX = new Map(TOPICS.map((topic) => [topic.id, topic]));

/** An empty progress record for a topic. */
export function createTopicProgress(topicId: string): TopicProgress {
  return {
    topicId,
    category: TOPIC_INDEX.get(topicId)?.category ?? topicId,
    explored: false,
    completed: false,
    questionsAttempted: 0,
    correctAnswers: 0,
    challengesAttempted: 0,
    challengesAccepted: 0,
    practicalsCompleted: 0,
  };
}

/** The topic a question belongs to. */
export function topicOfQuestion(questionId: string): string | undefined {
  return ALL_QUESTIONS.find((question) => question.id === questionId)?.topic;
}

/** The topic of a challenge — the challenges use their own category names. */
export function topicOfChallenge(challengeCategory: string): string | undefined {
  return TOPICS.find((topic) => topic.category === challengeCategory)?.id;
}

/**
 * A topic counts as completed when every question of the topic was answered
 * correctly at least once.
 */
export function isTopicComplete(topicId: string, progress: TopicProgress): boolean {
  const questions = ALL_QUESTIONS.filter((question) => question.topic === topicId);
  if (questions.length === 0) {
    return false;
  }
  return progress.correctAnswers >= questions.length;
}

/**
 * Recomputes the topic progress from the recorded learning data.
 * The rules are simple and explainable:
 * - a question counts as attempted when it was answered at least once,
 * - a topic is *explored* when at least half of its questions were attempted,
 * - a topic is *completed* when every question of the topic was answered
 *   correctly at least once.
 *
 * The progress is tracked per canonical topic (the category of the question),
 * so the dashboard always shows the same ten topics.
 */
export function recomputeTopicProgress(data: LearningData): Record<string, TopicProgress> {
  const progress: Record<string, TopicProgress> = {};

  for (const topic of TOPICS) {
    progress[topic.id] = createTopicProgress(topic.id);
  }

  const questionsByTopic = new Map<string, string[]>();
  for (const question of ALL_QUESTIONS) {
    const topicId = TOPIC_INDEX.has(question.category) ? question.category : 'fundamentals';
    const list = questionsByTopic.get(topicId) ?? [];
    list.push(question.id);
    questionsByTopic.set(topicId, list);
  }

  for (const [topicId, questionIds] of questionsByTopic) {
    const entry = progress[topicId] ?? createTopicProgress(topicId);
    const attempted = questionIds.filter(
      (id) => (data.wrongAnswers[id] ?? 0) + (data.correctAnswers[id] ?? 0) > 0
    );
    const correct = questionIds.filter((id) => (data.correctAnswers[id] ?? 0) > 0);

    entry.questionsAttempted = attempted.length;
    entry.correctAnswers = correct.length;
    entry.explored = attempted.length >= Math.ceil(questionIds.length / 2);
    entry.completed = correct.length === questionIds.length && questionIds.length > 0;

    const lastPracticed = [...attempted]
      .map((id) =>
        data.quizAttempts.find((attempt) => attempt.questionIds.includes(id))?.completedAt
      )
      .filter((value): value is number => typeof value === 'number')
      .sort((a, b) => b - a)[0];
    if (lastPracticed) {
      entry.lastPracticedAt = lastPracticed;
    }

    progress[topicId] = entry;
  }

  return progress;
}

/** The topics that still have questions to answer. */
export function getIncompleteTopics(data: LearningData): TopicProgress[] {
  return Object.values(data.topicProgress).filter((entry) => !entry.completed);
}
