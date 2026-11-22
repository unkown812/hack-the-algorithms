import { PRACTICALS } from './practicals';
import { hashString } from '../quizzes/QuizEngine';
import type { MockExam, MockExamResult, SubmissionStatus } from '../practice/types';

/**
 * Mock practical examinations.
 *
 * A mock exam is a *practice* examination that imitates the structure of a
 * university practical paper. It is never presented as an official exam.
 */

export const MOCK_EXAMS: MockExam[] = [
  {
    id: 'mock-searching-sorting',
    title: 'Mock Practical — Searching and Sorting',
    practicalIds: ['prac-binary-search', 'prac-insertion-sort'],
    durationSeconds: 3600,
    totalMarks: 20,
    passingMarks: 10,
    description:
      'Two university-style practical questions on searching and sorting. This is a practice paper prepared by the extension, not an official examination.',
  },
  {
    id: 'mock-greedy-dnc',
    title: 'Mock Practical — Greedy and Divide and Conquer',
    practicalIds: ['prac-kruskal-mst', 'prac-fractional-knapsack', 'prac-min-max-dc'],
    durationSeconds: 5400,
    totalMarks: 30,
    passingMarks: 15,
    description:
      'Three practical questions covering greedy algorithms and divide and conquer. A practice paper prepared by the extension.',
  },
  {
    id: 'mock-graph-dp',
    title: 'Mock Practical — Graph and Dynamic Programming',
    practicalIds: ['prac-floyd-warshall', 'prac-bellman-ford'],
    durationSeconds: 4800,
    totalMarks: 20,
    passingMarks: 10,
    description:
      'Two graph practical questions. A practice paper prepared by the extension, not an official examination.',
  },
  {
    id: 'mock-backtracking-bnb',
    title: 'Mock Practical — Backtracking and Branch and Bound',
    practicalIds: ['prac-8-queens', 'prac-15-puzzle', 'prac-rabin-karp'],
    durationSeconds: 5400,
    totalMarks: 30,
    passingMarks: 15,
    description:
      'Three practical questions on backtracking, branch and bound and string matching. A practice paper prepared by the extension.',
  },
];

/** The mock exam that contains a given practical, if there is one. */
export function getMockExamForPractical(practicalId: string): MockExam | undefined {
  return MOCK_EXAMS.find((exam) => exam.practicalIds.includes(practicalId));
}

export function getMockExamById(examId: string): MockExam | undefined {
  return MOCK_EXAMS.find((exam) => exam.id === examId);
}

/** The marks of one practical inside a mock exam. */
export function marksPerPractical(exam: MockExam): number {
  return exam.practicalIds.length > 0 ? exam.totalMarks / exam.practicalIds.length : 0;
}

/**
 * Builds the result of a mock exam.
 * A practical counts as solved when its program was accepted by the evaluator.
 */
export function buildMockExamResult(
  exam: MockExam,
  results: Record<string, SubmissionStatus>,
  startedAt: number,
  completedAt = Date.now()
): MockExamResult {
  const perPractical = marksPerPractical(exam);

  let score = 0;
  for (const practicalId of exam.practicalIds) {
    if (results[practicalId] === 'accepted') {
      score += perPractical;
    }
  }

  return {
    id: `mock-result-${hashString(exam.id + startedAt.toString())}`,
    examId: exam.id,
    startedAt,
    completedAt,
    score,
    maxScore: exam.totalMarks,
    passed: score >= exam.passingMarks,
    results: { ...results },
    durationSeconds: Math.round((completedAt - startedAt) / 1000),
  };
}

/** The practical exercises that are part of the mock exams. */
export function getPracticalsInMockExams(): string[] {
  return [...new Set(MOCK_EXAMS.flatMap((exam) => exam.practicalIds))].filter((id) =>
    PRACTICALS.some((practical) => practical.id === id)
  );
}
