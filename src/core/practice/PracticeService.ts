import { ALL_QUESTIONS, filterQuestions, getQuestionById, validateQuestionBank } from '../questions/QuestionRegistry';
import { evaluateAnswer } from '../questions/AnswerEvaluator';
import {
  buildQuiz,
  createQuizQuestions,
  submitQuiz,
  QUIZ_PRESETS,
} from '../quizzes/QuizEngine';
import { describeScoring, policyForQuiz } from '../quizzes/QuizScoringService';
import { filterChallenges, getChallengeById, toPublicChallenge } from '../challenges/ChallengeRegistry';
import { ChallengeEvaluator } from '../challenges/ChallengeEvaluator';
import { ExecutionService } from '../execution/ExecutionService';
import { GCCCompiler } from '../compiler/GCCCompiler';
import { detectCompiler } from '../compiler/CompilerDetector';
import { getPracticalView, listPracticals } from '../practicals/PracticalExamService';
import { MOCK_EXAMS, buildMockExamResult } from '../practicals/MockExamEngine';
import { VIVA_QUESTIONS, pickRandomVivaQuestion } from '../practicals/VivaQuestionService';
import { BookmarkService } from '../bookmarks/BookmarkService';
import { AchievementService, computeStatistics } from '../achievements/AchievementService';
import { recomputeTopicProgress } from '../progress/TopicProgressTracker';
import { analyzePerformance } from '../progress/PerformanceAnalyzer';
import { buildRecommendations, buildComplexityRecommendation } from '../progress/RevisionRecommendationService';
import { LearningDataStore } from '../storage/LearningDataStore';
import { migrateLearningData } from '../storage/DataMigrationService';
import type {
  Bookmark,
  ChallengeSubmission,
  LearningData,
  Question,
  QuestionFilter,
  QuizAttempt,
  QuizConfig,
  QuizQuestion,
  QuizResult,
  TestCaseModel,
  VivaQuestion,
} from './types';

/**
 * The facade of the practice centre.
 *
 * The extension host uses this service for every request of the webview: it
 * owns the question bank, the quizzes, the challenge evaluation (through the
 * Phase 5 execution service) and the local progress data.
 */
export class PracticeService {
  private readonly store: LearningDataStore;
  private readonly evaluator: ChallengeEvaluator;
  private readonly achievements = new AchievementService();

  constructor(store: LearningDataStore, executionService?: ExecutionService) {
    this.store = store;
    this.evaluator = new ChallengeEvaluator(
      executionService ?? new ExecutionService(new GCCCompiler(detectCompiler()))
    );
  }

  // --- question bank -------------------------------------------------------

  /** The questions that match the filter. */
  getQuestions(filter: QuestionFilter = {}): Question[] {
    return filterQuestions(filter);
  }

  /** A single question. */
  getQuestion(id: string): Question | undefined {
    return getQuestionById(id);
  }

  /** The problems of the question bank — used by the self check. */
  validateBank(): ReturnType<typeof validateQuestionBank> {
    return validateQuestionBank(ALL_QUESTIONS);
  }

  /** Judges an answer without storing it. */
  evaluate(questionId: string, answer: string | string[] | undefined) {
    const question = getQuestionById(questionId);
    if (!question) {
      return undefined;
    }
    return evaluateAnswer(question, answer);
  }

  // --- quizzes -------------------------------------------------------------

  /** The suggested quiz presets. */
  getQuizPresets(): QuizConfig[] {
    return QUIZ_PRESETS;
  }

  /** Builds a quiz and returns the questions without starting an attempt. */
  previewQuiz(config: QuizConfig): { questions: Question[]; scoring: string } {
    const built = buildQuiz(config, {
      preferIds: this.revisionQuestionIds(),
    });
    return {
      questions: built.questions,
      scoring: describeScoring(policyForQuiz(config, built.questions.length), built.questions.length),
    };
  }

  /** Starts a quiz and stores the attempt as "in progress". */
  startQuiz(config: QuizConfig): { attempt: QuizAttempt; questions: QuizQuestion[]; scoring: string } {
    const built = buildQuiz(config, { preferIds: this.revisionQuestionIds() });
    const entries = createQuizQuestions(built.questions);
    const startedAt = Date.now();

    const attempt: QuizAttempt = {
      id: `attempt-${startedAt.toString(36)}`,
      quizId: config.id,
      quizTitle: config.title,
      mode: config.mode,
      startedAt,
      status: 'in-progress',
      answers: {},
      questionIds: built.questions.map((question) => question.id),
      markedQuestionIds: [],
    };

    this.update((data) => ({
      ...data,
      quizAttempts: [...data.quizAttempts, attempt],
      activeQuiz: attempt,
    }));

    return {
      attempt,
      questions: entries,
      scoring: describeScoring(policyForQuiz(config, entries.length), entries.length),
    };
  }

  /** Stores an answer of the running quiz. */
  answerQuiz(
    attemptId: string,
    questionId: string,
    answer: string | string[]
  ): { correct: boolean; explanation: string } | undefined {
    const question = getQuestionById(questionId);
    if (!question) {
      return undefined;
    }

    const evaluation = evaluateAnswer(question, answer);
    const attempt = this.store.read().quizAttempts.find((entry) => entry.id === attemptId);

    this.update((data) => ({
      ...data,
      quizAttempts: data.quizAttempts.map((entry) =>
        entry.id === attemptId
          ? { ...entry, answers: { ...entry.answers, [questionId]: answer } }
          : entry
      ),
    }));

    void attempt;

    return { correct: evaluation.correct, explanation: evaluation.explanation };
  }

  /** Marks a question of the running quiz for review. */
  markQuestion(attemptId: string, questionId: string, marked: boolean): string[] {
    let markedIds: string[] = [];
    this.update((data) => {
      markedIds = data.quizAttempts.find((entry) => entry.id === attemptId)?.markedQuestionIds ?? [];
      const next = marked
        ? [...new Set([...markedIds, questionId])]
        : markedIds.filter((id) => id !== questionId);

      return {
        ...data,
        quizAttempts: data.quizAttempts.map((entry) =>
          entry.id === attemptId ? { ...entry, markedQuestionIds: next } : entry
        ),
      };
    });
    return markedIds;
  }

  /** Submits the quiz, stores the result and returns it. */
  submitQuiz(attemptId: string): QuizResult | undefined {
    const data = this.store.read();
    const attempt = data.quizAttempts.find((entry) => entry.id === attemptId);
    if (!attempt) {
      return undefined;
    }

    const config = this.getQuizConfig(attempt);
    const questions = attempt.questionIds
      .map((id) => getQuestionById(id))
      .filter((question): question is Question => question !== undefined);

    const entries: QuizQuestion[] = questions.map((question) => {
      const answer = attempt.answers[question.id];
      return {
        question,
        answer,
        answered: answer !== undefined,
        correct: false,
        marks: 0,
        marked: attempt.markedQuestionIds.includes(question.id),
      };
    });

    const result = submitQuiz(config, entries, attempt.startedAt, Date.now());

    this.update((current) => ({
      ...current,
      quizAttempts: current.quizAttempts.map((entry) =>
        entry.id === attemptId ? result.attempt : entry
      ),
      activeQuiz: undefined,
      wrongAnswers: this.countAnswers(result, current.wrongAnswers, false),
      correctAnswers: this.countAnswers(result, current.correctAnswers, true),
    }));

    return result;
  }

  /** Abandons a running quiz — it stays "in progress" and can be resumed. */
  abandonQuiz(attemptId: string): void {
    this.update((data) => ({
      ...data,
      activeQuiz: data.activeQuiz?.id === attemptId ? undefined : data.activeQuiz,
    }));
  }

  /** The unfinished quiz of the student, if there is one. */
  getActiveQuiz(): QuizAttempt | undefined {
    return this.store.read().activeQuiz;
  }

  private getQuizConfig(attempt: QuizAttempt): QuizConfig {
    const preset = QUIZ_PRESETS.find((entry) => entry.id === attempt.quizId);
    return (
      preset ?? {
        id: attempt.quizId,
        title: attempt.quizTitle,
        questionCount: attempt.questionIds.length,
        mode: attempt.mode,
      }
    );
  }

  private revisionQuestionIds(): string[] {
    const data = this.store.read();
    return Object.entries(data.wrongAnswers)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
  }

  private countAnswers(
    result: QuizResult,
    current: Record<string, number>,
    correct: boolean
  ): Record<string, number> {
    const next = { ...current };
    for (const entry of result.questions) {
      const id = entry.question.id;
      if (correct && entry.correct) {
        next[id] = (next[id] ?? 0) + 1;
      }
      if (!correct && !entry.correct && entry.answered) {
        next[id] = (next[id] ?? 0) + 1;
      }
    }
    return next;
  }

  // --- coding challenges ----------------------------------------------------

  /** The challenges that match the filter. */
  getChallenges(filter: { category?: string; difficulty?: string } = {}) {
    return filterChallenges({
      category: filter.category,
      difficulty: filter.difficulty as never,
    }).map((challenge) => toPublicChallenge(challenge));
  }

  /** One challenge without the hidden test cases. */
  getChallenge(id: string) {
    const challenge = getChallengeById(id);
    return challenge ? toPublicChallenge(challenge) : undefined;
  }

  /** The reference solution — only revealed after a submission. */
  getReferenceSolution(id: string): string | undefined {
    return getChallengeById(id)?.referenceSolution;
  }

  /** Compiles the submitted code and runs it against every test case. */
  async submitChallenge(
    challengeId: string,
    source: string,
    options: { timeoutMs?: number } = {}
  ): Promise<{ submission: ChallengeSubmission; feedback: string } | undefined> {
    const challenge = getChallengeById(challengeId);
    if (!challenge) {
      return undefined;
    }

    const { submission, feedback } = await this.evaluator.evaluate(challenge, source, options);

    this.update((data) => ({
      ...data,
      submissions: [...data.submissions, submission],
    }));

    return { submission, feedback };
  }

  /** The recorded submissions of the student. */
  getSubmissions(): ChallengeSubmission[] {
    return this.store.read().submissions;
  }

  // --- practicals -----------------------------------------------------------

  /** The practical exercises. */
  getPracticals(category?: string) {
    return listPracticals(category).map((practical) => ({
      id: practical.id,
      name: practical.name,
      category: practical.category,
      aim: practical.aim,
      problemStatement: practical.problemStatement,
      timeComplexity: practical.timeComplexity,
      spaceComplexity: practical.spaceComplexity,
      vivaCount: practical.vivaQuestions.length,
    }));
  }

  /** The practical in the requested mode. */
  getPractical(id: string, mode: 'guided' | 'independent' | 'mock', revealed = false) {
    return getPracticalView(id, mode, revealed);
  }

  /** The mock exams. */
  getMockExams(): typeof MOCK_EXAMS {
    return MOCK_EXAMS;
  }

  /** Stores the result of a mock exam. */
  recordMockExam(
    examId: string,
    results: Record<string, ChallengeSubmission['status']>,
    startedAt: number
  ) {
    const exam = MOCK_EXAMS.find((entry) => entry.id === examId);
    if (!exam) {
      return undefined;
    }

    const result = buildMockExamResult(exam, results, startedAt);

    this.update((data) => ({ ...data, mockExams: [result, ...data.mockExams] }));

    return result;
  }

  // --- viva -----------------------------------------------------------------

  /** The viva questions, optionally of one topic. */
  getVivaQuestions(topic?: string): VivaQuestion[] {
    return topic
      ? VIVA_QUESTIONS.filter((question) => question.topic === topic)
      : [...VIVA_QUESTIONS];
  }

  /** A random viva question. */
  getRandomVivaQuestion(seed: number, topic?: string): VivaQuestion | undefined {
    return pickRandomVivaQuestion(seed, topic);
  }

  // --- bookmarks ------------------------------------------------------------

  /** The bookmarks of the student. */
  getBookmarks(filter: { kind?: Bookmark['kind']; category?: string } = {}): Bookmark[] {
    return BookmarkService.filter(this.store.read(), filter);
  }

  /** Adds or removes a bookmark. */
  toggleBookmark(bookmark: Omit<Bookmark, 'createdAt' | 'reviewed'>): Bookmark[] {
    const data = this.store.read();
    const exists = BookmarkService.isBookmarked(data, bookmark.kind, bookmark.itemId);
    const next = exists
      ? BookmarkService.remove(data, bookmark.kind, bookmark.itemId)
      : BookmarkService.add(data, bookmark);

    this.write(next);
    return next.bookmarks;
  }

  /** Marks a bookmark as reviewed. */
  markBookmarkReviewed(kind: Bookmark['kind'], itemId: string, reviewed = true): void {
    this.write(BookmarkService.markReviewed(this.store.read(), kind, itemId, reviewed));
  }

  // --- progress -------------------------------------------------------------

  /** The full learning data with the statistics recomputed. */
  getProgress() {
    const data = this.store.read();
    const performance = analyzePerformance(data);
    const recommendations = buildRecommendations(data);
    const complexity = buildComplexityRecommendation(data);

    return {
      statistics: data.statistics,
      topicProgress: data.topicProgress,
      performance,
      recommendations: complexity ? [complexity, ...recommendations] : recommendations,
      achievements: data.achievements,
      attempts: data.quizAttempts.length,
      submissions: data.submissions.length,
      bookmarks: data.bookmarks.length,
    };
  }

  /** Records that the student opened an algorithm. */
  recordAlgorithmExplored(algorithmId: string): void {
    this.update((data) =>
      data.exploredAlgorithms.includes(algorithmId)
        ? data
        : { ...data, exploredAlgorithms: [...data.exploredAlgorithms, algorithmId] }
    );
  }

  /** The achievements that were earned so far. */
  getAchievements() {
    return this.store.read().achievements;
  }

  // --- storage --------------------------------------------------------------

  /** The stored learning data. */
  getData(): LearningData {
    return this.store.read();
  }

  /** Removes every stored learning record. */
  reset(): void {
    this.store.reset();
  }

  /** Exports the learning data as JSON. */
  exportJson(): string {
    return this.store.exportJson();
  }

  /** Imports learning data that was exported before. */
  importJson(json: string): { imported: boolean; error?: string } {
    return this.store.importJson(json);
  }

  /** Runs the data migration — used after an update of the extension. */
  migrate(): { migrated: boolean; notes: string[] } {
    const raw = this.store.read();
    const result = migrateLearningData(raw);
    this.write(result.data);
    return { migrated: result.migrated, notes: result.notes };
  }

  /** Saves the test cases of a program. */
  saveTestCases(programId: string, testCases: TestCaseModel[]): void {
    this.update((data) => ({
      ...data,
      testCases: { ...(data.testCases ?? {}), [programId]: testCases },
    }));
  }

  /** The test cases of a program. */
  getTestCases(programId: string): TestCaseModel[] {
    return this.store.read().testCases?.[programId] ?? [];
  }

  // --- internals ------------------------------------------------------------

  private update(change: (data: LearningData) => LearningData): void {
    const data = change(this.store.read());
    this.write(data);
  }

  private write(data: LearningData): void {
    // The topic progress and the statistics are always derived from the
    // recorded events, never edited by hand.
    const withProgress: LearningData = {
      ...data,
      topicProgress: recomputeTopicProgress(data),
      statistics: computeStatistics(data),
    };

    const earned = this.achievements.evaluate(withProgress);
    const withAchievements: LearningData = {
      ...withProgress,
      achievements:
        earned.length > 0 ? [...withProgress.achievements, ...earned] : withProgress.achievements,
    };

    this.store.write(withAchievements);
  }
}
