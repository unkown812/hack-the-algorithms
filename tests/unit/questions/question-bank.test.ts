import { describe, expect, it } from 'vitest';
import {
  ALL_QUESTIONS,
  filterQuestions,
  getQuestionById,
  getQuestionCategories,
  getQuestionTopics,
  validateQuestionBank,
} from '../../../src/core/questions/QuestionRegistry';
import {
  evaluateAnswer,
  normalizeOutput,
  normalizeText,
} from '../../../src/core/questions/AnswerEvaluator';

describe('question bank', () => {
  it('passes its own validation', () => {
    const issues = validateQuestionBank();
    expect(issues).toEqual([]);
  });

  it('has unique question ids', () => {
    const ids = ALL_QUESTIONS.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every documented category', () => {
    const categories = getQuestionCategories();
    for (const category of [
      'fundamentals',
      'searching',
      'sorting',
      'greedy',
      'divide-and-conquer',
      'dynamic-programming',
      'graph',
      'backtracking',
      'branch-and-bound',
      'string-matching',
    ]) {
      expect(categories).toContain(category);
    }
  });

  it('ships questions of every difficulty', () => {
    const difficulties = new Set(ALL_QUESTIONS.map((question) => question.difficulty));
    expect(difficulties.has('beginner')).toBe(true);
    expect(difficulties.has('intermediate')).toBe(true);
    expect(difficulties.has('advanced')).toBe(true);
  });

  it('ships every question type of the specification', () => {
    const types = new Set(ALL_QUESTIONS.map((question) => question.type));
    expect(types.has('mcq')).toBe(true);
    expect(types.has('multiple-select')).toBe(true);
    expect(types.has('true-false')).toBe(true);
    expect(types.has('fill-blank')).toBe(true);
    expect(types.has('code-output')).toBe(true);
    expect(types.has('find-error')).toBe(true);
    expect(types.has('complexity')).toBe(true);
    expect(types.has('short-answer')).toBe(true);
  });

  it('filters by category, topic and difficulty', () => {
    const searching = filterQuestions({ category: 'searching' });
    expect(searching.length).toBeGreaterThan(0);
    expect(searching.every((question) => question.category === 'searching')).toBe(true);

    const advanced = filterQuestions({ difficulty: 'advanced' });
    expect(advanced.every((question) => question.difficulty === 'advanced')).toBe(true);

    const topic = filterQuestions({ topic: 'binary-search' });
    expect(topic.every((question) => question.topic === 'binary-search')).toBe(true);
  });

  it('finds a question by id', () => {
    expect(getQuestionById('fund-001')?.title).toBeTruthy();
    expect(getQuestionById('does-not-exist')).toBeUndefined();
  });

  it('lists the topics of the bank', () => {
    expect(getQuestionTopics().length).toBeGreaterThan(5);
  });
});

describe('answer evaluation', () => {
  it('judges a single choice question', () => {
    const question = getQuestionById('fund-001')!;
    const correct = question.correctAnswer as string;

    expect(evaluateAnswer(question, correct).correct).toBe(true);
    expect(evaluateAnswer(question, 'Something else').correct).toBe(false);
  });

  it('ignores the case and the whitespace of an answer', () => {
    const question = getQuestionById('fund-001')!;
    const correct = (question.correctAnswer as string).toUpperCase();

    expect(evaluateAnswer(question, `  ${correct}  `).correct).toBe(true);
  });

  it('judges a multiple select question by the complete set', () => {
    const question = getQuestionById('dp-001')!;
    const correct = question.correctAnswer as string[];

    expect(evaluateAnswer(question, correct).correct).toBe(true);
    expect(evaluateAnswer(question, [correct[0]]).correct).toBe(false);
    expect(evaluateAnswer(question, [...correct, 'A greedy choice property']).correct).toBe(false);
  });

  it('judges a fill blank question and accepts alternatives', () => {
    const question = getQuestionById('fund-005')!;

    expect(evaluateAnswer(question, 'divide and conquer').correct).toBe(true);
    expect(evaluateAnswer(question, 'Divide And Conquer').correct).toBe(true);
    expect(evaluateAnswer(question, 'brute force').correct).toBe(false);
  });

  it('compares a code output after normalising the whitespace', () => {
    const question = getQuestionById('code-001')!;

    expect(evaluateAnswer(question, '5 3 8 1').correct).toBe(true);
    expect(evaluateAnswer(question, '5  3   8 1\n').correct).toBe(true);
    expect(evaluateAnswer(question, '1 3 8 5').correct).toBe(false);
  });

  it('judges a find-the-error question by the selected line', () => {
    const question = getQuestionById('err-001')!;

    expect(evaluateAnswer(question, '4').correct).toBe(true);
    expect(evaluateAnswer(question, '5').correct).toBe(false);
  });

  it('never judges a free-form answer automatically', () => {
    const question = getQuestionById('fund-008')!;
    const evaluation = evaluateAnswer(question, 'The greedy choice has to be globally optimal');

    expect(evaluation.selfAssess).toBe(true);
    expect(evaluation.correct).toBe(false);
    expect(evaluation.explanation.length).toBeGreaterThan(20);
  });

  it('treats a missing answer as wrong', () => {
    const question = getQuestionById('fund-001')!;
    expect(evaluateAnswer(question, undefined).correct).toBe(false);
  });

  it('normalises texts and outputs', () => {
    expect(normalizeText('  Hello   World ')).toBe('hello world');
    expect(normalizeOutput('a  b\n\n c ')).toBe('a b\n\nc');
    expect(normalizeOutput('a  b\nc\n\n')).toBe('a b\nc');
  });
});
