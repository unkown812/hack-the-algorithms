import { describe, expect, it } from 'vitest';
import { aiContextRegistry, visualizationContextItem } from '../../../src/webview/services/aiContextRegistry';
import { PracticeService } from '../../../src/core/practice/PracticeService';
import { LearningDataStore } from '../../../src/core/storage/LearningDataStore';
import { ALL_QUESTIONS } from '../../../src/core/questions/QuestionRegistry';
import type { Question } from '../../../src/core/practice/types';
import type { ExecutionStep } from '../../../src/core/visualization/types';

const STEP: ExecutionStep = {
  id: 4,
  description: 'Compare a[0] and a[1]',
  operation: 'comparison',
  currentState: {
    array: {
      values: [5, 2, 8, 1],
      length: 4,
      elementStyles: {},
    },
    variables: { i: 0 },
    stepIndex: 3,
    status: 'running',
  },
  comparedElements: [0, 1],
  swappedElements: [0, 1],
  explanation: '5 > 2 so the elements will be exchanged.',
  complexity: { operations: 4, comparisons: 2, swaps: 1, iterations: 1 },
};

describe('learning context registry', () => {
  it('publishes an item and lists it', () => {
    aiContextRegistry.publish({
      id: 'test-item',
      kind: 'algorithm',
      label: 'Algorithm — Test',
      content: 'The content',
      origin: 'test',
    });

    const items = aiContextRegistry.list();
    expect(items.some((item) => item.id === 'test-item')).toBe(true);

    aiContextRegistry.clear('test');
    expect(aiContextRegistry.list().some((item) => item.id === 'test-item')).toBe(false);
  });

  it('notifies the subscribers', () => {
    const seen: number[] = [];
    const unsubscribe = aiContextRegistry.subscribe((items) => seen.push(items.length));

    aiContextRegistry.publish({
      id: 'notified-item',
      kind: 'code',
      label: 'Code',
      content: 'int main(void) {}',
      origin: 'notify-test',
    });

    expect(seen.length).toBeGreaterThan(0);

    unsubscribe();
    aiContextRegistry.clear('notify-test');
  });

  it('describes a visualization step factually', () => {
    const item = visualizationContextItem('bubble-sort', 'Bubble Sort', STEP, 3, 12);

    expect(item.kind).toBe('visualization');
    expect(item.content).toContain('Bubble Sort');
    expect(item.content).toContain('Current step: 4 of 12');
    expect(item.content).toContain('Array: [5, 2, 8, 1]');
    expect(item.content).toContain('Compared elements: 0 (5) and 1 (2)');
    expect(item.content).toContain('Exchanged elements: 0, 1');
    expect(item.content).toContain('comparisons 2');
    expect(item.source).toBe('Visualization engine');
  });
});

describe('practice centre with reviewed questions', () => {
  const REVIEWED: Question = {
    id: 'draft-1',
    title: 'Reviewed question',
    category: 'sorting',
    topic: 'sorting',
    difficulty: 'intermediate',
    type: 'mcq',
    question: 'Which sorting algorithm is stable?',
    options: ['Quick sort', 'Merge sort'],
    correctAnswer: 'Merge sort',
    explanation: 'Merge sort preserves the relative order of equal elements.',
    tags: ['ai-generated', 'reviewed'],
  };

  function createService(extra: Question[] = []) {
    let stored = undefined as ReturnType<LearningDataStore['read']>;
    const store = new LearningDataStore({
      read: () => stored,
      write: (data) => {
        stored = data;
      },
    });
    return new PracticeService(store, undefined, () => extra);
  }

  it('offers the reviewed questions next to the verified ones', () => {
    const service = createService([REVIEWED]);
    const questions = service.getQuestions();

    expect(questions.length).toBe(ALL_QUESTIONS.length + 1);
    expect(questions.some((question) => question.id === 'draft-1')).toBe(true);
  });

  it('never changes the verified bank', () => {
    const service = createService([REVIEWED]);
    service.getQuestions();

    expect(ALL_QUESTIONS.some((question) => question.id === 'draft-1')).toBe(false);
    expect(ALL_QUESTIONS.length).toBeGreaterThan(0);
  });

  it('finds a reviewed question by id', () => {
    const service = createService([REVIEWED]);
    expect(service.getQuestion('draft-1')?.title).toBe('Reviewed question');
  });

  it('judges the answer of a reviewed question', () => {
    const service = createService([REVIEWED]);
    const evaluation = service.evaluate('draft-1', 'Merge sort');
    expect(evaluation?.correct).toBe(true);
  });

  it('respects the category filter', () => {
    const service = createService([REVIEWED]);
    const questions = service.getQuestions({ category: 'graph' });
    expect(questions.some((question) => question.id === 'draft-1')).toBe(false);
  });

  it('puts a reviewed question into a quiz of the same category', () => {
    const service = createService([REVIEWED]);
    const preview = service.previewQuiz({
      id: 'reviewed-quiz',
      title: 'Reviewed',
      category: 'sorting',
      questionCount: 40,
      mode: 'learning',
    });

    expect(preview.questions.some((question) => question.id === 'draft-1')).toBe(true);
  });

  it('keeps a reviewed question out of a quiz of another category', () => {
    const service = createService([REVIEWED]);
    const preview = service.previewQuiz({
      id: 'graph-quiz',
      title: 'Graph',
      category: 'graph',
      questionCount: 40,
      mode: 'learning',
    });

    expect(preview.questions.some((question) => question.id === 'draft-1')).toBe(false);
  });
});
