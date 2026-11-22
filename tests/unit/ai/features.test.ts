import { describe, expect, it } from 'vitest';
import { AlgorithmTutor } from '../../../src/core/ai/features/AlgorithmTutor';
import { CodeExplainer } from '../../../src/core/ai/features/CodeExplainer';
import { DebuggingAssistant } from '../../../src/core/ai/features/DebuggingAssistant';
import { ComplexityTutor } from '../../../src/core/ai/features/ComplexityTutor';
import {
  VisualizationAssistant,
  type VisualizationStep,
} from '../../../src/core/ai/features/VisualizationAssistant';
import { LearningAdvisor } from '../../../src/core/ai/features/LearningAdvisor';
import { QuestionGenerator } from '../../../src/core/ai/features/QuestionGenerator';
import { PracticalAssistant } from '../../../src/core/ai/features/PracticalAssistant';
import { buildSystemPrompt } from '../../../src/core/ai/prompts/system/tutor.prompt';
import { createEmptyLearningData } from '../../../src/core/storage/LearningDataStore';
import type { LearningData } from '../../../src/core/practice/types';

describe('algorithm tutor', () => {
  const tutor = new AlgorithmTutor();

  it('builds the request from the verified registry', () => {
    const request = tutor.build({ algorithmId: 'merge-sort' });
    expect(request.task).toBe('algorithm-explanation');
    expect(request.selection.algorithmId).toBe('merge-sort');
    expect(request.question).toContain('Merge Sort');
  });

  it('passes the question of the student through', () => {
    const request = tutor.build({ algorithmId: 'merge-sort', question: 'Why O(n log n)?' });
    expect(request.question).toBe('Why O(n log n)?');
  });

  it('offers the follow-up questions', () => {
    const suggestions = tutor.getFollowUps('bubble-sort');
    expect(suggestions.some((suggestion) => suggestion.text.includes('Bubble Sort'))).toBe(true);
    expect(suggestions.some((suggestion) => suggestion.text.includes('worst case'))).toBe(true);
  });

  it('returns the verified resources', () => {
    const resources = tutor.getResources('bubble-sort');
    expect(resources.length).toBeGreaterThan(0);
  });
});

describe('code explainer', () => {
  const explainer = new CodeExplainer();

  const CODE = 'for (int i = 0; i < n - 1; i++) { /* bubble pass */ }';

  it('builds the explain request with the code as context', () => {
    const request = explainer.build({ code: CODE, fileName: 'bubble.c' });
    expect(request.task).toBe('code-explanation');
    expect(request.selection.code).toBe(CODE);
    expect(request.selection.codeFileName).toBe('bubble.c');
    expect(request.question).toContain(CODE);
  });

  it('maps the editor actions to the right tasks', () => {
    expect(explainer.build({ code: CODE, action: 'bugs' }).task).toBe('debugging');
    expect(explainer.build({ code: CODE, action: 'complexity' }).task).toBe('complexity');
    expect(explainer.build({ code: CODE, action: 'pseudocode' }).task).toBe('code-explanation');
  });

  it('offers follow-up suggestions', () => {
    expect(explainer.getSuggestions().some((suggestion) => suggestion.text.includes('Walk me through'))).toBe(true);
  });
});

describe('debugging assistant', () => {
  const assistant = new DebuggingAssistant();

  it('builds the request with the real diagnostics', () => {
    const request = assistant.build({
      code: 'int main(void) { return 0 }',
      diagnostics: [
        {
          severity: 'error',
          message: 'expected \';\' before \'}\' token',
          file: 'main.c',
          line: 1,
          column: 29,
          explanation: 'A semicolon is missing.',
        },
      ],
    });

    expect(request.task).toBe('debugging');
    expect(request.selection.diagnostics).toHaveLength(1);
  });

  it('summarizes the evidence for the UI', () => {
    const summary = assistant.summarize({
      diagnostics: [
        { severity: 'error', message: 'a', file: 'f', line: 1, column: 1, explanation: '' },
        { severity: 'warning', message: 'b', file: 'f', line: 2, column: 1, explanation: '' },
      ],
      execution: { status: 'exited', stdout: '', stderr: '', exitCode: 0, durationMs: 5 },
    });
    expect(summary).toContain('1 error(s)');
    expect(summary).toContain('exited');
  });

  it('is honest when there is no evidence at all', () => {
    const request = assistant.build({});
    expect(request.selection.diagnostics).toBeUndefined();
    expect(request.selection.execution).toBeUndefined();
  });
});

describe('complexity tutor', () => {
  const tutor = new ComplexityTutor();

  it('builds the request with the Phase 4 results', () => {
    const request = tutor.build({
      algorithmId: 'merge-sort',
      complexity: {
        theoretical: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', auxiliary: 'O(n)' },
        instrumented: { comparisons: 17, swaps: 6, totalOperations: 23 },
        measured: { meanTimeMs: 0.3, trials: 5 },
      },
    });

    expect(request.task).toBe('complexity');
    expect(request.selection.complexity?.theoretical.worst).toBe('O(n log n)');
  });

  it('explains which numbers are measured and which are theoretical', () => {
    const note = tutor.buildEvidenceNote({
      complexity: {
        theoretical: { best: 'O(n)', average: 'O(n)', worst: 'O(n^2)', auxiliary: 'O(1)' },
        instrumented: { comparisons: 5, swaps: 2, totalOperations: 7 },
        measured: { meanTimeMs: 1, trials: 3 },
      },
    });
    expect(note).toContain('theoretical');
    expect(note).toContain('deterministic');
    expect(note).toContain('depends on the machine');
  });
});

describe('visualization assistant', () => {
  const assistant = new VisualizationAssistant();

  const STEP: VisualizationStep = {
    algorithmId: 'bubble-sort',
    stepIndex: 3,
    totalSteps: 12,
    description: 'Compare a[0] and a[1]',
    explanation: '5 > 2 so the elements will be exchanged.',
    operation: 'comparison',
    array: { values: [5, 2, 8, 1], comparedIndices: [0, 1], swappedIndices: [0, 1] },
    variables: { i: 0, j: 1 },
  };

  it('describes the step factually from the trace', () => {
    const text = assistant.describeStep(STEP);
    expect(text).toContain('comparison');
    expect(text).toContain('[5, 2, 8, 1]');
    expect(text).toContain('Step 4 of 12');
  });

  it('says when no step is active', () => {
    expect(assistant.describeStep(undefined)).toContain('No visualization step');
  });

  it('translates natural playback commands — and only real ones', () => {
    expect(assistant.parseCommand('Move to the next comparison')).toEqual({ type: 'next' });
    expect(assistant.parseCommand('Go back one step')).toEqual({ type: 'previous' });
    expect(assistant.parseCommand('Explain the current step')).toEqual({ type: 'none' });
    expect(assistant.parseCommand('Why was this element selected?')).toEqual({ type: 'none' });
  });

  it('builds the request with the visualization context', () => {
    const request = assistant.build({ step: STEP });
    expect(request.task).toBe('visualization');
    expect(request.selection.visualization?.algorithmId).toBe('bubble-sort');
    expect(request.selection.visualization?.array?.values).toEqual([5, 2, 8, 1]);
  });
});

describe('learning advisor', () => {
  const advisor = new LearningAdvisor();

  it('recommends weak topics, missed challenges and unexplored categories', () => {
    const data: LearningData = {
      ...createEmptyLearningData(),
      topicProgress: {
        sorting: {
          topicId: 'sorting',
          category: 'sorting',
          explored: true,
          completed: false,
          questionsAttempted: 10,
          correctAnswers: 4,
          challengesAttempted: 0,
          challengesAccepted: 0,
          practicalsCompleted: 0,
        },
      },
      wrongAnswers: { 'q-1': 3 },
      exploredAlgorithms: ['linear-search'],
    };

    const recommendations = advisor.generateRecommendations(data);

    expect(recommendations.some((r) => r.kind === 'topic' && r.targetId === 'sorting')).toBe(true);
    expect(recommendations.some((r) => r.kind === 'question' && r.targetId === 'q-1')).toBe(true);
    expect(recommendations.some((r) => r.kind === 'algorithm')).toBe(true);
    // Sorted by priority.
    for (let i = 1; i < recommendations.length; i += 1) {
      expect(recommendations[i - 1].priority).toBeGreaterThanOrEqual(recommendations[i].priority);
    }
  });

  it('builds a prerequisite roadmap', () => {
    const data = createEmptyLearningData();
    const roadmap = advisor.buildRoadmap(data);
    expect(roadmap.length).toBeGreaterThan(0);
    expect(roadmap[0].reason.toLowerCase()).toContain('prerequisite');
  });

  it('summarizes the progress without inventing numbers', () => {
    const summary = advisor.summarizeProgress(createEmptyLearningData());
    expect(summary).toContain('Algorithms explored: 0');
    expect(summary).toContain('Questions answered: 0');
  });

  it('offers the follow-up questions', () => {
    expect(advisor.getSuggestions().some((s) => s.text.includes('roadmap'))).toBe(true);
  });
});

describe('question generator', () => {
  const generator = new QuestionGenerator();

  it('builds the request', () => {
    const request = generator.build({ topic: 'sorting', difficulty: 'intermediate', count: 5 });
    expect(request.task).toBe('question-generation');
    expect(request.question).toContain('5');
  });

  it('filters the verified bank by the criteria', () => {
    const questions = generator.filterQuestions({ topic: 'sorting', difficulty: 'intermediate' });
    expect(questions.length).toBeGreaterThan(0);
    for (const question of questions) {
      expect(question.difficulty).toBe('intermediate');
    }
  });

  it('validates the structure and the answer options', () => {
    const valid = generator.getValidQuestions({ topic: 'sorting' });
    expect(valid.length).toBeGreaterThan(0);
    for (const question of valid) {
      expect(question.explanation.length).toBeGreaterThanOrEqual(20);
      if (['mcq', 'true-false', 'multiple-select'].includes(question.type)) {
        expect(question.options.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('rejects a choice question whose answer is not among the options', () => {
    const rejected = generator.validateQuestions([
      {
        id: 'q1',
        title: 'Broken',
        question: 'What?',
        type: 'mcq',
        options: ['A', 'B'],
        correctAnswer: 'C',
        explanation: 'An explanation that is long enough to pass the length rule.',
      },
    ]);
    expect(rejected).toHaveLength(0);
  });

  it('rejects a question without a sufficient explanation', () => {
    const rejected = generator.validateQuestions([
      {
        id: 'q2',
        title: 'No explanation',
        question: 'What?',
        type: 'mcq',
        options: ['A', 'B'],
        correctAnswer: 'A',
        explanation: 'Short.',
      },
    ]);
    expect(rejected).toHaveLength(0);
  });

  it('accepts a well-formed question', () => {
    const accepted = generator.validateQuestions([
      {
        id: 'q3',
        title: 'Good question',
        question: 'Which sorting algorithm is stable?',
        type: 'mcq',
        options: ['Quick sort', 'Merge sort'],
        correctAnswer: 'Merge sort',
        explanation: 'Merge sort preserves the relative order of equal elements; quick sort does not.',
      },
    ]);
    expect(accepted).toHaveLength(1);
  });
});

describe('practical assistant', () => {
  const assistant = new PracticalAssistant();

  it('builds the explanation request for a practical', () => {
    const request = assistant.build({ practicalId: 'prac-binary-search' });
    expect(request.task).toBe('practical');
    expect(request.question).toContain('binary search');
  });

  it('builds the viva request', () => {
    const request = assistant.build({ task: 'viva' });
    expect(request.task).toBe('viva');
    expect(request.question.toLowerCase()).toContain('viva');
  });

  it('builds the mock exam request', () => {
    const request = assistant.build({ task: 'mock-exam' });
    expect(request.question.toLowerCase()).toContain('mock exam');
  });

  it('offers the practical suggestions', () => {
    const suggestions = assistant.getSuggestions();
    expect(suggestions.some((s) => s.text.includes('viva'))).toBe(true);
  });

  it('returns the verified practical resources', () => {
    const resources = assistant.getResources('prac-binary-search');
    expect(resources.length).toBeGreaterThan(0);
  });
});

describe('tutor system prompt', () => {
  it('forbids fabrication and adapts to the mode', () => {
    const prompt = buildSystemPrompt('beginner', 'debugging');
    expect(prompt).toContain('never invent execution results');
    expect(prompt).toContain('compiled or executed');
    expect(prompt).toContain('distinguish the theoretical complexity');
    expect(prompt).toContain('Explanation mode');
  });

  it('adds the task instruction when a task is given', () => {
    expect(buildSystemPrompt('beginner', 'debugging')).toContain('compiler');
  });
});
