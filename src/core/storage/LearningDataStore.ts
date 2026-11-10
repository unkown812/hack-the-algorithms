import type { LearningData } from '../practice/types';

/**
 * Local persistence for the learning data.
 *
 * The store is deliberately small and transparent: it keeps the data in a
 * single object, merges it with the defaults on read (so a corrupted or
 * outdated file never breaks the extension) and writes it back through an
 * injected persistence adapter — the extension host uses the VS Code storage
 * APIs, the tests use an in-memory adapter.
 */

export const LEARNING_DATA_VERSION = 1;

/** The persistence adapter — implemented by the extension host. */
export interface LearningPersistence {
  read(): unknown;
  write(data: LearningData): void;
}

/** An empty learning data set. */
export function createEmptyLearningData(): LearningData {
  return {
    version: LEARNING_DATA_VERSION,
    quizAttempts: [],
    assessments: [],
    submissions: [],
    practicalSessions: [],
    mockExams: [],
    bookmarks: [],
    achievements: [],
    wrongAnswers: {},
    correctAnswers: {},
    topicProgress: {},
    exploredAlgorithms: [],
    statistics: {
      algorithmsExplored: 0,
      quizzesCompleted: 0,
      quizAccuracyTotal: 0,
      challengesAttempted: 0,
      challengesAccepted: 0,
      questionsAnswered: 0,
      questionsCorrect: 0,
      topicsExplored: 0,
      practicalsCompleted: 0,
      totalSessions: 0,
      activityByDay: {},
    },
  };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Merges stored data with the defaults.
 * Unknown or malformed entries are dropped instead of breaking the extension.
 */
export function normalizeLearningData(value: unknown): LearningData {
  const defaults = createEmptyLearningData();
  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const raw = value as Record<string, unknown>;
  const statistics = asRecord(raw.statistics);

  return {
    version: typeof raw.version === 'number' ? raw.version : defaults.version,
    quizAttempts: asArray(raw.quizAttempts),
    assessments: asArray(raw.assessments),
    submissions: asArray(raw.submissions),
    practicalSessions: asArray(raw.practicalSessions),
    mockExams: asArray(raw.mockExams),
    bookmarks: asArray(raw.bookmarks),
    achievements: asArray(raw.achievements),
    wrongAnswers: asRecord(raw.wrongAnswers) as Record<string, number>,
    correctAnswers: asRecord(raw.correctAnswers) as Record<string, number>,
    topicProgress: asRecord(raw.topicProgress) as LearningData['topicProgress'],
    exploredAlgorithms: asArray<string>(raw.exploredAlgorithms),
    statistics: {
      ...defaults.statistics,
      ...(statistics as Partial<LearningData['statistics']>),
      activityByDay: asRecord(statistics.activityByDay) as Record<string, number>,
    },
    activeQuiz: raw.activeQuiz && typeof raw.activeQuiz === 'object'
      ? (raw.activeQuiz as LearningData['activeQuiz'])
      : undefined,
  };
}

/**
 * Reads and writes the learning data.
 * Every read merges the stored data with the defaults, so the rest of the
 * extension can rely on a complete, well typed object.
 */
export class LearningDataStore {
  constructor(private readonly persistence: LearningPersistence) {}

  /** Reads the current data. */
  read(): LearningData {
    return normalizeLearningData(this.persistence.read());
  }

  /** Writes the data. */
  write(data: LearningData): void {
    this.persistence.write({ ...data, version: LEARNING_DATA_VERSION });
  }

  /** Updates the data with a change function. */
  update(change: (data: LearningData) => LearningData): LearningData {
    const next = change(this.read());
    this.write(next);
    return next;
  }

  /** Removes every stored learning record. */
  reset(): void {
    this.write(createEmptyLearningData());
  }

  /** Exports the data as JSON — the student owns their data. */
  exportJson(): string {
    return JSON.stringify(this.read(), null, 2);
  }

  /** Imports data that was exported before. Malformed input is ignored. */
  importJson(json: string): { imported: boolean; error?: string } {
    try {
      const parsed = JSON.parse(json);
      this.write(normalizeLearningData(parsed));
      return { imported: true };
    } catch (error) {
      return {
        imported: false,
        error: error instanceof Error ? error.message : 'The file could not be read.',
      };
    }
  }
}
