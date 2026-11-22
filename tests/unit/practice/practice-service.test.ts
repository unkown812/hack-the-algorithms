import { describe, expect, it } from 'vitest';
import { PracticeService } from '../../../src/core/practice/PracticeService';
import { LearningDataStore } from '../../../src/core/storage/LearningDataStore';
import { createEmptyLearningData } from '../../../src/core/storage/LearningDataStore';
import { getQuestionById } from '../../../src/core/questions/QuestionRegistry';
import { getChallengeById } from '../../../src/core/challenges/ChallengeRegistry';
import type { LearningData, QuizConfig } from '../../../src/core/practice/types';

function createService() {
  let stored: LearningData | undefined;
  const store = new LearningDataStore({
    read: () => stored,
    write: (data) => {
      stored = data;
    },
  });
  const service = new PracticeService(store);
  return {
    service,
    store,
    getData: (): LearningData => stored ?? createEmptyLearningData(),
  };
}

const CONFIG: QuizConfig = {
  id: 'preset-quick',
  title: 'Quick Quiz',
  questionCount: 5,
  mode: 'learning',
};

describe('practice service', () => {
  it('reports the size of the bundled material', () => {
    const { service } = createService();

    expect(service.getQuestions().length).toBeGreaterThan(50);
    expect(service.getChallenges().length).toBeGreaterThan(10);
    expect(service.getPracticals().length).toBe(10);
    expect(service.getVivaQuestions().length).toBeGreaterThan(10);
    expect(service.getQuizPresets().length).toBeGreaterThanOrEqual(4);
    expect(service.validateBank()).toEqual([]);
  });

  it('starts a quiz, stores the answers and calculates the result', () => {
    const { service, getData } = createService();

    const started = service.startQuiz(CONFIG);
    expect(started.questions).toHaveLength(5);
    expect(started.attempt.status).toBe('in-progress');
    expect(service.getActiveQuiz()?.id).toBe(started.attempt.id);

    for (const entry of started.questions) {
      const question = getQuestionById(entry.question.id)!;
      const answer = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer];
      service.answerQuiz(started.attempt.id, entry.question.id, answer);
    }

    const result = service.submitQuiz(started.attempt.id);
    expect(result).toBeDefined();
    expect(result!.correctCount).toBe(5);
    expect(result!.incorrectCount).toBe(0);
    expect(result!.score).toBe(5);
    expect(result!.attempt.status).toBe('completed');

    // The attempt is stored and the active quiz is cleared.
    expect(getData().quizAttempts).toHaveLength(1);
    expect(getData().activeQuiz).toBeUndefined();
  });

  it('counts the wrong answers for the revision list', () => {
    const { service, getData } = createService();

    const started = service.startQuiz(CONFIG);
    for (const entry of started.questions) {
      service.answerQuiz(started.attempt.id, entry.question.id, 'definitely wrong');
    }
    service.submitQuiz(started.attempt.id);

    const wrong = Object.values(getData().wrongAnswers).reduce((sum, count) => sum + count, 0);
    expect(wrong).toBe(5);
  });

  it('keeps an unfinished quiz so it can be resumed', () => {
    const { service } = createService();

    const started = service.startQuiz(CONFIG);
    service.answerQuiz(started.attempt.id, started.questions[0].question.id, 'answer');
    service.abandonQuiz(started.attempt.id);

    expect(service.getActiveQuiz()).toBeUndefined();
    expect(service.getData().quizAttempts[0].status).toBe('in-progress');
  });

  it('marks questions for review', () => {
    const { service } = createService();
    const started = service.startQuiz(CONFIG);

    service.markQuestion(started.attempt.id, started.questions[0].question.id, true);
    expect(service.getData().quizAttempts[0].markedQuestionIds).toContain(
      started.questions[0].question.id
    );
  });

  it('manages the bookmarks', () => {
    const { service } = createService();

    service.toggleBookmark({
      id: 'question:fund-001',
      kind: 'question',
      itemId: 'fund-001',
      title: 'Characteristics of an algorithm',
      category: 'fundamentals',
    });
    expect(service.getBookmarks()).toHaveLength(1);

    service.toggleBookmark({
      id: 'question:fund-001',
      kind: 'question',
      itemId: 'fund-001',
      title: 'Characteristics of an algorithm',
      category: 'fundamentals',
    });
    expect(service.getBookmarks()).toHaveLength(0);
  });

  it('records an explored algorithm', () => {
    const { service } = createService();

    service.recordAlgorithmExplored('bubble-sort');
    service.recordAlgorithmExplored('bubble-sort');

    expect(service.getData().exploredAlgorithms).toEqual(['bubble-sort']);
    expect(service.getProgress().statistics.algorithmsExplored).toBe(1);
  });

  it('computes the progress after a quiz', () => {
    const { service } = createService();

    const started = service.startQuiz(CONFIG);
    for (const entry of started.questions) {
      const question = getQuestionById(entry.question.id)!;
      const answer = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer];
      service.answerQuiz(started.attempt.id, entry.question.id, answer);
    }
    service.submitQuiz(started.attempt.id);

    const progress = service.getProgress();
    expect(progress.statistics.quizzesCompleted).toBe(1);
    expect(progress.statistics.questionsAnswered).toBe(5);
    expect(progress.performance.overallAccuracy).toBe(100);
    expect(progress.recommendations.length).toBeGreaterThan(0);
  });

  it('never exposes the hidden test cases of a challenge', () => {
    const { service } = createService();
    const challenge = service.getChallenge('ch-find-minimum');

    expect(challenge).toBeDefined();
    expect(challenge?.hiddenCases).toBeUndefined();
    expect(JSON.stringify(challenge)).not.toContain(getChallengeById('ch-find-minimum')!.hiddenCases[0].input);
  });

  it('exports and imports the learning data', () => {
    const { service } = createService();
    service.recordAlgorithmExplored('quick-sort');

    const json = service.exportJson();
    const target = createService();
    const result = target.service.importJson(json);

    expect(result.imported).toBe(true);
    expect(target.service.getData().exploredAlgorithms).toEqual(['quick-sort']);
  });

  it('resets the learning data', () => {
    const { service } = createService();
    service.recordAlgorithmExplored('quick-sort');
    service.reset();

    expect(service.getData().exploredAlgorithms).toEqual([]);
    expect(service.getData().statistics.questionsAnswered).toBe(0);
  });

  it('starts with an empty data set', () => {
    const { service } = createService();
    expect(service.getData()).toEqual(createEmptyLearningData());
  });
});
