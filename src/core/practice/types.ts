/**
 * Shared types for the Phase 6 practice, assessment and progress system.
 *
 * This module is imported by the extension host and the webview, so it stays
 * free of Node.js and VS Code APIs.
 */

export type { TestCase } from '../playground/types';

import type { TestCase as PlaygroundTestCase } from '../playground/types';

/** The test case type used by the practice centre. */
export type TestCaseModel = PlaygroundTestCase;

export type QuestionType =
  | 'mcq'
  | 'multiple-select'
  | 'true-false'
  | 'fill-blank'
  | 'code-output'
  | 'find-error'
  | 'complexity'
  | 'short-answer';

export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Question {
  id: string;
  title: string;
  /** Broad category, e.g. "sorting". */
  category: string;
  /** Fine grained topic, e.g. "bubble-sort". */
  topic: string;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  question: string;
  /** Options for choice based questions. */
  options?: string[];
  /** The accepted answer (one value, or several for multiple-select). */
  correctAnswer: string | string[];
  /** Why the answer is right — and, where useful, why the others are wrong. */
  explanation: string;
  /** Optional hints shown in learning mode. */
  hints?: string[];
  tags: string[];
  estimatedTimeSeconds?: number;
  /** Optional C snippet for code-output and find-error exercises. */
  code?: string;
  /** Line numbers of the snippet that can be selected (find-error). */
  errorLines?: number[];
  /** The corrected snippet (find-error). */
  correctedCode?: string;
  /** Algorithm of the registry the question belongs to (optional). */
  algorithmId?: string;
}

export interface QuestionFilter {
  category?: string;
  topic?: string;
  difficulty?: QuestionDifficulty;
  type?: QuestionType;
  algorithmId?: string;
  /** Only questions that were answered incorrectly before. */
  onlyIncorrect?: boolean;
  /** Only bookmarked questions. */
  onlyBookmarked?: boolean;
  /** Restrict to a set of question ids. */
  ids?: string[];
  limit?: number;
}

export type PracticeMode = 'learning' | 'test' | 'revision';

export interface QuizConfig {
  id: string;
  title: string;
  category?: string;
  difficulty?: QuestionDifficulty;
  questionCount: number;
  durationSeconds?: number;
  mode: PracticeMode;
  /** Marks deducted per wrong answer; 0 means no negative marking. */
  negativeMarking?: number;
  /** Restrict to specific question types. */
  types?: QuestionType[];
  /** Restrict to a specific topic. */
  topic?: string;
  description?: string;
}

export interface QuizQuestion {
  question: Question;
  /** The student's answer. */
  answer?: string | string[];
  /** Whether the answer was submitted and judged. */
  answered: boolean;
  correct: boolean;
  /** Marks awarded for this question. */
  marks: number;
  /** Flagged for review. */
  marked: boolean;
}

export type QuizAttemptStatus = 'in-progress' | 'completed' | 'abandoned';

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  mode: PracticeMode;
  startedAt: number;
  completedAt?: number;
  status: QuizAttemptStatus;
  /** Question id → answer. */
  answers: Record<string, string | string[]>;
  questionIds: string[];
  markedQuestionIds: string[];
  score?: number;
  maxScore?: number;
  accuracy?: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  durationSeconds?: number;
  /** Topic → {correct, total}. */
  topicBreakdown?: Record<string, { correct: number; total: number }>;
}

export interface QuizResult {
  attempt: QuizAttempt;
  questions: QuizQuestion[];
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  score: number;
  maxScore: number;
  accuracy: number;
  durationSeconds: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
  /** Topics that should be revised, derived from the wrong answers. */
  recommendedRevision: string[];
}

export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ChallengeTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  /** Hidden cases are never shown to the student. */
  hidden: boolean;
  description?: string;
  comparisonMode?: 'exact' | 'normalized' | 'numeric';
}

export interface CodingChallenge {
  id: string;
  title: string;
  category: string;
  difficulty: ChallengeDifficulty;
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  sampleCases: ChallengeTestCase[];
  /** Public practice tests (visible). */
  practiceCases: ChallengeTestCase[];
  /** Hidden evaluation tests (never shown). */
  hiddenCases: ChallengeTestCase[];
  expectedComplexity?: { time: string; space: string };
  hints: string[];
  supportedLanguages: string[];
  /** A reference solution used for the "solution" panel. */
  referenceSolution?: string;
  algorithmId?: string;
}

export type SubmissionStatus =
  | 'accepted'
  | 'wrong-answer'
  | 'compile-error'
  | 'runtime-error'
  | 'time-limit-exceeded'
  | 'partial';

export interface ChallengeTestResult {
  testCaseId: string;
  hidden: boolean;
  passed: boolean;
  expectedOutput: string;
  actualOutput: string;
  durationMs: number;
  exitCode: number | null;
  status: SubmissionStatus;
  detail?: string;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  challengeTitle: string;
  /** The category of the challenge — used for the topic statistics. */
  challengeCategory?: string;
  language: string;
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  submittedAt: number;
  durationMs: number;
  source?: string;
  testResults: ChallengeTestResult[];
  diagnostics?: Array<{
    severity: string;
    message: string;
    line: number;
    column: number | null;
    explanation: string;
  }>;
}

export interface PracticalExercise {
  id: string;
  name: string;
  category: string;
  aim: string;
  theory: string;
  problemStatement: string;
  algorithm: string[];
  pseudocode: string[];
  cProgram: string;
  sampleInput: string;
  sampleOutput: string;
  timeComplexity: string;
  spaceComplexity: string;
  conclusion: string;
  vivaQuestions: VivaQuestion[];
}

export interface VivaQuestion {
  id: string;
  question: string;
  expectedAnswer: string;
  /** Keywords a self-assessment can look for. */
  keywords: string[];
  topic: string;
  category: string;
}

export type PracticalMode = 'guided' | 'independent' | 'mock';

export interface PracticalSession {
  id: string;
  practicalId: string;
  mode: PracticalMode;
  startedAt: number;
  completedAt?: number;
  /** Student source code, when the student implemented the solution. */
  source?: string;
  status: 'in-progress' | 'completed' | 'abandoned';
  testResults?: ChallengeTestResult[];
  status_result?: SubmissionStatus;
  revealedSolution?: boolean;
}

export interface MockExam {
  id: string;
  title: string;
  practicalIds: string[];
  durationSeconds: number;
  totalMarks: number;
  passingMarks: number;
  description: string;
}

export interface MockExamResult {
  id: string;
  examId: string;
  startedAt: number;
  completedAt: number;
  score: number;
  maxScore: number;
  passed: boolean;
  /** Practical id → submission status. */
  results: Record<string, SubmissionStatus>;
  durationSeconds: number;
}

export type AssessmentType =
  | 'quiz'
  | 'coding-challenge'
  | 'practical'
  | 'mock-exam'
  | 'viva';

export interface AssessmentResult {
  id: string;
  type: AssessmentType;
  title: string;
  category?: string;
  completedAt: number;
  durationSeconds: number;
  score: number;
  maxScore: number;
  accuracy: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  negativeMarking: number;
  passed?: boolean;
  passingScore?: number;
  /** Topic → {correct, total}. */
  topicBreakdown: Record<string, { correct: number; total: number }>;
  detail?: string;
}

export interface TopicProgress {
  topicId: string;
  category: string;
  explored: boolean;
  completed: boolean;
  questionsAttempted: number;
  correctAnswers: number;
  challengesAttempted: number;
  challengesAccepted: number;
  practicalsCompleted: number;
  lastPracticedAt?: number;
}

export interface Bookmark {
  id: string;
  /** "question" | "challenge" | "algorithm" | "practical" | "viva" */
  kind: 'question' | 'challenge' | 'algorithm' | 'practical' | 'viva';
  /** The id of the bookmarked item inside its kind. */
  itemId: string;
  title: string;
  category?: string;
  createdAt: number;
  reviewed: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** The rule that decides whether the achievement is granted. */
  criteria: {
    metric:
      | 'algorithmsExplored'
      | 'quizzesCompleted'
      | 'challengesSolved'
      | 'challengesAccepted'
      | 'questionsAnswered'
      | 'topicsExplored'
      | 'practicalsCompleted'
      | 'categoryChallengesAccepted'
      | 'categoryCorrectAnswers';
    threshold: number;
    /** Optional category for the category-scoped metrics. */
    category?: string;
  };
}

export interface EarnedAchievement {
  id: string;
  earnedAt: number;
}

export interface LearningStatistics {
  algorithmsExplored: number;
  quizzesCompleted: number;
  quizAccuracyTotal: number;
  challengesAttempted: number;
  challengesAccepted: number;
  questionsAnswered: number;
  questionsCorrect: number;
  topicsExplored: number;
  practicalsCompleted: number;
  totalSessions: number;
  /** Day → number of learning activities, for the activity chart. */
  activityByDay: Record<string, number>;
}

export interface RevisionRecommendation {
  id: string;
  title: string;
  reason: string;
  priority: number;
  kind: 'topic' | 'question' | 'challenge' | 'algorithm' | 'resource';
  /** Optional target the UI can open. */
  targetId?: string;
}

export interface LearningData {
  /** Schema version — used by the migration service. */
  version: number;
  quizAttempts: QuizAttempt[];
  assessments: AssessmentResult[];
  submissions: ChallengeSubmission[];
  practicalSessions: PracticalSession[];
  mockExams: MockExamResult[];
  bookmarks: Bookmark[];
  achievements: EarnedAchievement[];
  /** Question id → number of wrong answers. */
  wrongAnswers: Record<string, number>;
  /** Question id → number of correct answers. */
  correctAnswers: Record<string, number>;
  /** Topic id → progress. */
  topicProgress: Record<string, TopicProgress>;
  /** Algorithm ids the student opened. */
  exploredAlgorithms: string[];
  statistics: LearningStatistics;
  /** An unfinished quiz that is restored on the next start. */
  activeQuiz?: QuizAttempt;
  /** The test cases of the saved programs. */
  testCases?: Record<string, PlaygroundTestCase[]>;
}

export interface LearningDataStore {
  read(): LearningData | undefined;
  write(data: LearningData): void;
}
