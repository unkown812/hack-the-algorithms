import { describe, expect, it } from 'vitest';
import { LearningDataStore, createEmptyLearningData, normalizeLearningData } from '../../../src/core/storage/LearningDataStore';
import { migrateLearningData } from '../../../src/core/storage/DataMigrationService';
import { BookmarkService } from '../../../src/core/bookmarks/BookmarkService';
import { AchievementService, computeStatistics } from '../../../src/core/achievements/AchievementService';
import { ACHIEVEMENTS } from '../../../src/core/achievements/AchievementRegistry';
import { recomputeTopicProgress, TOPICS } from '../../../src/core/progress/TopicProgressTracker';
import { analyzePerformance } from '../../../src/core/progress/PerformanceAnalyzer';
import { buildRecommendations } from '../../../src/core/progress/RevisionRecommendationService';
import { getQuestionById } from '../../../src/core/questions/QuestionRegistry';
import type { LearningData } from '../../../src/core/practice/types';

function createMemoryStore(initial?: unknown) {
  let value = initial;
  return {
    read: () => value,
    write: (data: LearningData) => {
      value = data;
    },
    get value() {
      return value;
    },
  };
}

describe('learning data store', () => {
  it('creates an empty data set', () => {
    const data = createEmptyLearningData();

    expect(data.version).toBeGreaterThan(0);
    expect(data.quizAttempts).toEqual([]);
    expect(data.statistics.questionsAnswered).toBe(0);
  });

  it('merges malformed stored data with the defaults', () => {
    const data = normalizeLearningData({ quizAttempts: 'not an array', statistics: 42 });

    expect(data.quizAttempts).toEqual([]);
    expect(data.statistics.questionsAnswered).toBe(0);
    expect(data.version).toBeGreaterThan(0);
  });

  it('survives completely broken data', () => {
    const data = normalizeLearningData(undefined);
    expect(data.bookmarks).toEqual([]);
  });

  it('reads and writes through the adapter', () => {
    const adapter = createMemoryStore();
    const store = new LearningDataStore(adapter);

    const data = store.read();
    data.exploredAlgorithms.push('bubble-sort');
    store.write(data);

    expect(store.read().exploredAlgorithms).toEqual(['bubble-sort']);
  });

  it('exports and imports the data', () => {
    const store = new LearningDataStore(createMemoryStore());
    store.update((data) => ({ ...data, exploredAlgorithms: ['quick-sort'] }));

    const json = store.exportJson();
    const target = new LearningDataStore(createMemoryStore());
    const result = target.importJson(json);

    expect(result.imported).toBe(true);
    expect(target.read().exploredAlgorithms).toEqual(['quick-sort']);
  });

  it('rejects broken imports without destroying the data', () => {
    const store = new LearningDataStore(createMemoryStore());
    const result = store.importJson('{not json');

    expect(result.imported).toBe(false);
    expect(result.error).toBeTruthy();
    expect(store.read().exploredAlgorithms).toEqual([]);
  });

  it('resets the data', () => {
    const store = new LearningDataStore(createMemoryStore());
    store.update((data) => ({ ...data, exploredAlgorithms: ['bubble-sort'] }));
    store.reset();

    expect(store.read().exploredAlgorithms).toEqual([]);
  });
});

describe('data migration', () => {
  it('keeps a data set of the current version', () => {
    const result = migrateLearningData(createEmptyLearningData());

    expect(result.migrated).toBe(false);
    expect(result.toVersion).toBe(result.fromVersion);
  });

  it('completes an unversioned data set', () => {
    const result = migrateLearningData({ quizAttempts: [] });

    expect(result.data.version).toBeGreaterThan(0);
    expect(result.data.quizAttempts).toEqual([]);
  });

  it('does not touch data of a newer version', () => {
    const result = migrateLearningData({ version: 999, quizAttempts: [] });

    expect(result.migrated).toBe(false);
    expect(result.notes.join(' ')).toMatch(/newer version/i);
  });
});

describe('bookmarks', () => {
  it('adds, finds and removes a bookmark', () => {
    let data = createEmptyLearningData();
    data = BookmarkService.add(data, {
      id: 'question:fund-001',
      kind: 'question',
      itemId: 'fund-001',
      title: 'Characteristics of an algorithm',
    });

    expect(BookmarkService.isBookmarked(data, 'question', 'fund-001')).toBe(true);
    expect(data.bookmarks).toHaveLength(1);

    data = BookmarkService.remove(data, 'question', 'fund-001');
    expect(BookmarkService.isBookmarked(data, 'question', 'fund-001')).toBe(false);
  });

  it('does not duplicate a bookmark', () => {
    let data = createEmptyLearningData();
    const bookmark = {
      id: 'question:fund-001',
      kind: 'question' as const,
      itemId: 'fund-001',
      title: 'Characteristics of an algorithm',
    };

    data = BookmarkService.add(data, bookmark);
    data = BookmarkService.add(data, bookmark);

    expect(data.bookmarks).toHaveLength(1);
  });

  it('filters the bookmarks by kind', () => {
    let data = createEmptyLearningData();
    data = BookmarkService.add(data, {
      id: 'question:fund-001',
      kind: 'question',
      itemId: 'fund-001',
      title: 'A',
    });
    data = BookmarkService.add(data, {
      id: 'challenge:ch-find-minimum',
      kind: 'challenge',
      itemId: 'ch-find-minimum',
      title: 'B',
    });

    expect(BookmarkService.filter(data, { kind: 'challenge' })).toHaveLength(1);
    expect(BookmarkService.filter(data)).toHaveLength(2);
  });
});

describe('achievements', () => {
  const service = new AchievementService();

  it('grants an achievement only when its criteria are met', () => {
    const data = createEmptyLearningData();
    data.exploredAlgorithms = ['bubble-sort'];
    data.statistics.algorithmsExplored = 1;

    const earned = service.evaluate(data);
    expect(earned.map((entry) => entry.id)).toContain('ach-first-algorithm');
  });

  it('does not grant an achievement for missing activity', () => {
    const data = createEmptyLearningData();
    const earned = service.evaluate(data);

    expect(earned).toHaveLength(0);
  });

  it('grants the quiz achievement after a completed quiz', () => {
    const data = createEmptyLearningData();
    data.statistics.quizzesCompleted = 1;

    expect(service.evaluate(data).map((entry) => entry.id)).toContain('ach-first-quiz');
  });

  it('has a meaningful catalogue', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(8);
    for (const achievement of ACHIEVEMENTS) {
      expect(achievement.criteria.threshold).toBeGreaterThan(0);
      expect(achievement.description.length).toBeGreaterThan(10);
    }
  });

  it('computes the statistics from the recorded data', () => {
    const data = createEmptyLearningData();
    data.correctAnswers = { 'fund-001': 3, 'fund-002': 1 };
    data.wrongAnswers = { 'fund-001': 1 };
    data.quizAttempts = [
      {
        id: 'a1',
        quizId: 'q',
        quizTitle: 'Q',
        mode: 'learning',
        startedAt: 1,
        completedAt: 2,
        status: 'completed',
        answers: {},
        questionIds: ['fund-001'],
        markedQuestionIds: [],
        accuracy: 80,
      },
    ];

    const statistics = computeStatistics(data);
    expect(statistics.questionsAnswered).toBe(5);
    expect(statistics.questionsCorrect).toBe(4);
    expect(statistics.quizzesCompleted).toBe(1);
    expect(Object.keys(statistics.activityByDay).length).toBe(1);
  });
});

describe('topic progress and performance', () => {
  it('creates a progress record for every topic', () => {
    const progress = recomputeTopicProgress(createEmptyLearningData());

    expect(Object.keys(progress)).toHaveLength(TOPICS.length);
    expect(progress['searching'].explored).toBe(false);
  });

  it('marks a topic as explored when half of its questions were answered', () => {
    const data = createEmptyLearningData();
    const searching = ['search-001', 'search-002', 'search-003', 'search-004', 'search-005'];
    for (const id of searching) {
      data.correctAnswers[id] = 1;
    }

    const progress = recomputeTopicProgress(data);
    expect(progress['searching'].questionsAttempted).toBe(5);
    expect(progress['searching'].explored).toBe(true);
    expect(progress['searching'].completed).toBe(false);
  });

  it('never calls a topic weak because of a single wrong answer', () => {
    const data = createEmptyLearningData();
    data.wrongAnswers = { 'search-001': 1 };

    const performance = analyzePerformance(data);
    const searching = performance.topics.find((topic) => topic.topicId === 'searching');

    expect(searching?.status).not.toBe('weak');
  });

  it('reports the questions that were answered wrongly twice', () => {
    const data = createEmptyLearningData();
    data.wrongAnswers = { 'search-001': 2, 'fund-001': 1 };

    const performance = analyzePerformance(data);
    expect(performance.frequentMistakes.map((mistake) => mistake.questionId)).toEqual(['search-001']);
  });

  it('suggests a revision for a repeatedly wrong concept', () => {
    const data = createEmptyLearningData();
    data.wrongAnswers = { 'search-001': 3 };

    const recommendations = buildRecommendations(data);
    expect(recommendations.some((entry) => entry.targetId === 'search-001')).toBe(true);
    expect(recommendations[0].reason.length).toBeGreaterThan(10);
  });

  it('explains every recommendation', () => {
    const data = createEmptyLearningData();
    const recommendations = buildRecommendations(data);

    for (const recommendation of recommendations) {
      expect(recommendation.reason.length).toBeGreaterThan(10);
      expect(recommendation.title.length).toBeGreaterThan(3);
    }
  });
});
