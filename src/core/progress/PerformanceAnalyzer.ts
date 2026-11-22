import { ALL_QUESTIONS, getQuestionById } from '../questions/QuestionRegistry';
import { TOPICS } from './TopicProgressTracker';
import type { LearningData, TopicProgress } from '../practice/types';

/**
 * Rule based performance analysis.
 *
 * Every statement the dashboard makes can be reproduced by hand:
 * - a topic is *strong* when at least 80 % of its questions were answered
 *   correctly and at least five questions were attempted,
 * - a topic is *weak* when at least five questions were attempted and less
 *   than 60 % of them were correct.
 *
 * A single wrong answer never makes a topic weak.
 */

export interface TopicPerformance {
  topicId: string;
  label: string;
  attempted: number;
  correct: number;
  accuracy: number;
  status: 'strong' | 'moderate' | 'weak' | 'not-started';
  challengesAttempted: number;
  challengesAccepted: number;
  practicalsCompleted: number;
  lastPracticedAt?: number;
}

export interface FrequentMistake {
  questionId: string;
  title: string;
  topic: string;
  wrongCount: number;
  totalCount: number;
}

export interface PerformanceOverview {
  topics: TopicPerformance[];
  strongTopics: TopicPerformance[];
  weakTopics: TopicPerformance[];
  frequentMistakes: FrequentMistake[];
  overallAccuracy: number;
  questionsAnswered: number;
  questionsCorrect: number;
}

const MIN_ATTEMPTS_FOR_A_VERDICT = 5;
const STRONG_THRESHOLD = 80;
const WEAK_THRESHOLD = 60;

/** Computes the performance of every topic. */
export function analyzePerformance(data: LearningData): PerformanceOverview {
  const topics: TopicPerformance[] = TOPICS.map((topic) => {
    const progress: TopicProgress = data.topicProgress[topic.id] ?? {
      topicId: topic.id,
      category: topic.category,
      explored: false,
      completed: false,
      questionsAttempted: 0,
      correctAnswers: 0,
      challengesAttempted: 0,
      challengesAccepted: 0,
      practicalsCompleted: 0,
    };

    const attempted = progress.questionsAttempted;
    const correct = progress.correctAnswers;
    const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

    let status: TopicPerformance['status'] = 'not-started';
    if (attempted >= MIN_ATTEMPTS_FOR_A_VERDICT) {
      if (accuracy >= STRONG_THRESHOLD) {
        status = 'strong';
      } else if (accuracy < WEAK_THRESHOLD) {
        status = 'weak';
      } else {
        status = 'moderate';
      }
    } else if (attempted > 0) {
      status = 'moderate';
    }

    return {
      topicId: topic.id,
      label: topic.label,
      attempted,
      correct,
      accuracy: Math.round(accuracy * 10) / 10,
      status,
      challengesAttempted: progress.challengesAttempted,
      challengesAccepted: progress.challengesAccepted,
      practicalsCompleted: progress.practicalsCompleted,
      lastPracticedAt: progress.lastPracticedAt,
    };
  });

  const frequentMistakes: FrequentMistake[] = Object.entries(data.wrongAnswers)
    .filter(([, wrong]) => wrong >= 2)
    .map(([questionId, wrong]) => {
      const question = getQuestionById(questionId);
      return {
        questionId,
        title: question?.title ?? questionId,
        topic: question?.topic ?? 'unknown',
        wrongCount: wrong,
        totalCount: wrong + (data.correctAnswers[questionId] ?? 0),
      };
    })
    .sort((a, b) => b.wrongCount - a.wrongCount);

  const questionsAnswered = Object.keys(data.correctAnswers).length + Object.keys(data.wrongAnswers).length;
  const correctAnswers = Object.values(data.correctAnswers).reduce((sum, value) => sum + value, 0);

  return {
    topics,
    strongTopics: topics.filter((topic) => topic.status === 'strong'),
    weakTopics: topics.filter((topic) => topic.status === 'weak'),
    frequentMistakes,
    overallAccuracy:
      questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 1000) / 10 : 0,
    questionsAnswered,
    questionsCorrect: correctAnswers,
  };
}

/** The questions of a topic that were answered incorrectly at least twice. */
export function getRepeatedMistakes(data: LearningData, topic?: string): FrequentMistake[] {
  return analyzePerformance(data).frequentMistakes.filter(
    (mistake) => !topic || mistake.topic === topic
  );
}

/** The topics that have questions that were never attempted. */
export function getUntouchedQuestions(topicId: string): string[] {
  return ALL_QUESTIONS.filter(
    (question) => question.topic === topicId && question.type === 'mcq'
  ).map((question) => question.id);
}
