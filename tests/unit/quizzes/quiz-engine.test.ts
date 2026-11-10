import { describe, expect, it } from 'vitest';
import {
  buildQuiz,
  createCustomQuiz,
  createQuizQuestions,
  hashString,
  shuffle,
} from '../../../src/core/quizzes/QuizEngine';
import {
  describeScoring,
  marksPerQuestion,
  policyForQuiz,
  scoreQuestions,
} from '../../../src/core/quizzes/QuizScoringService';
import { getQuestionById } from '../../../src/core/questions/QuestionRegistry';
import type { QuizConfig } from '../../../src/core/practice/types';

const CONFIG: QuizConfig = {
  id: 'test-quiz',
  title: 'Test quiz',
  questionCount: 5,
  mode: 'learning',
};

describe('quiz building', () => {
  it('selects the requested number of questions', () => {
    const quiz = buildQuiz(CONFIG);

    expect(quiz.questions).toHaveLength(5);
    expect(new Set(quiz.questions.map((question) => question.id)).size).toBe(5);
  });

  it('is reproducible for the same seed', () => {
    const first = buildQuiz(CONFIG, { seed: 1234 });
    const second = buildQuiz(CONFIG, { seed: 1234 });

    expect(second.questions.map((question) => question.id)).toEqual(
      first.questions.map((question) => question.id)
    );
  });

  it('filters by category and difficulty', () => {
    const quiz = buildQuiz({ ...CONFIG, category: 'searching', difficulty: 'beginner' });

    for (const question of quiz.questions) {
      expect(question.category).toBe('searching');
      expect(question.difficulty).toBe('beginner');
    }
  });

  it('prefers the questions of a revision list', () => {
    const quiz = buildQuiz(CONFIG, { preferIds: ['fund-001', 'search-001'] });

    expect(quiz.questions.map((question) => question.id)).toContain('fund-001');
    expect(quiz.questions.map((question) => question.id)).toContain('search-001');
  });

  it('excludes the questions of the exclude list', () => {
    const quiz = buildQuiz(CONFIG, { excludeIds: ['fund-001'] });
    expect(quiz.questions.map((question) => question.id)).not.toContain('fund-001');
  });

  it('shuffles deterministically', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffle(items, 42)).toEqual(shuffle(items, 42));
    expect(shuffle(items, 42)).not.toEqual(shuffle(items, 43));
    expect(shuffle(items, 42).sort((a, b) => a - b)).toEqual(items);
  });

  it('hashes strings stably', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
  });

  it('creates a custom quiz configuration', () => {
    const config = createCustomQuiz({
      title: 'Sorting quiz',
      questionCount: 8,
      category: 'sorting',
      mode: 'test',
    });

    expect(config.questionCount).toBe(8);
    expect(config.category).toBe('sorting');
    expect(config.mode).toBe('test');
    expect(config.negativeMarking).toBe(0);
  });
});

describe('scoring', () => {
  const buildEntries = (correctCount: number, total = 5) => {
    const questions = Array.from({ length: total }, (_, index) => ({
      question: getQuestionById(`fund-00${index + 1}`) ?? getQuestionById('fund-001')!,
      answered: true,
      correct: index < correctCount,
      marks: index < correctCount ? 1 : 0,
      marked: false,
    }));
    return questions;
  };

  it('gives one mark per correct answer', () => {
    const breakdown = scoreQuestions(buildEntries(3), {
      totalMarks: 5,
      negativeMarking: 0,
    });

    expect(breakdown.score).toBe(3);
    expect(breakdown.maxScore).toBe(5);
    expect(breakdown.correct).toBe(3);
    expect(breakdown.incorrect).toBe(2);
    expect(breakdown.unanswered).toBe(0);
    expect(breakdown.accuracy).toBe(60);
  });

  it('counts unanswered questions separately', () => {
    const entries = buildEntries(2);
    entries[4].answered = false;

    const breakdown = scoreQuestions(entries, { totalMarks: 5, negativeMarking: 0 });

    expect(breakdown.unanswered).toBe(1);
    expect(breakdown.incorrect).toBe(2);
    expect(breakdown.score).toBe(2);
  });

  it('applies the negative marking when it is configured', () => {
    const breakdown = scoreQuestions(buildEntries(3), { totalMarks: 5, negativeMarking: 0.5 });

    expect(breakdown.score).toBe(2);
  });

  it('reports the topics that should be revised', () => {
    const breakdown = scoreQuestions(buildEntries(3), { totalMarks: 5, negativeMarking: 0 });

    expect(breakdown.recommendedRevision.length).toBeGreaterThan(0);
    expect(breakdown.topicBreakdown).toBeDefined();
  });

  it('computes the marks per question', () => {
    expect(marksPerQuestion({ totalMarks: 20, negativeMarking: 0 }, 10)).toBe(2);
    expect(marksPerQuestion({ totalMarks: 20, negativeMarking: 0 }, 0)).toBe(0);
  });

  it('builds the default policy of a quiz', () => {
    const policy = policyForQuiz(CONFIG, 5);
    expect(policy.totalMarks).toBe(5);
    expect(policy.negativeMarking).toBe(0);
  });

  it('describes the scoring rules in plain words', () => {
    expect(describeScoring({ totalMarks: 5, negativeMarking: 0 }, 5)).toMatch(/no negative marking/i);
    expect(describeScoring({ totalMarks: 5, negativeMarking: 1 }, 5)).toMatch(/costs 1 mark/i);
  });

  it('detects a passed result when a passing score is set', () => {
    const breakdown = scoreQuestions(buildEntries(4), {
      totalMarks: 5,
      negativeMarking: 0,
      passingScore: 4,
    });

    expect(breakdown.passed).toBe(true);
  });
});

describe('quiz questions', () => {
  it('creates an unanswered working state', () => {
    const entries = createQuizQuestions([
      getQuestionById('fund-001')!,
      getQuestionById('fund-002')!,
    ]);

    expect(entries).toHaveLength(2);
    expect(entries[0].answered).toBe(false);
    expect(entries[0].marked).toBe(false);
  });
});
