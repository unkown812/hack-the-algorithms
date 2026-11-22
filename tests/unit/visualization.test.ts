import { describe, it, expect } from 'vitest';
import {
  BUBBLE_SORT_GENERATOR,
  SELECTION_SORT_GENERATOR,
  INSERTION_SORT_GENERATOR,
  MERGE_SORT_GENERATOR,
  QUICK_SORT_GENERATOR,
} from '../../src/core/visualization/generators/sorting';
import {
  LINEAR_SEARCH_GENERATOR,
  BINARY_SEARCH_GENERATOR,
} from '../../src/core/visualization/generators/searching';
import { visualizationEngine } from '../../src/core/visualization/generators';
import { StepManager } from '../../src/core/visualization/engine/StepManager';
import { ExecutionController } from '../../src/core/visualization/engine/ExecutionController';

function getFinalArray(trace: { finalState: { array?: { values: number[] } } }): number[] {
  return trace.finalState?.array?.values ?? [];
}

describe('Sorting Generators - Correctness', () => {
  const generators = [
    { name: 'Bubble Sort', gen: BUBBLE_SORT_GENERATOR },
    { name: 'Selection Sort', gen: SELECTION_SORT_GENERATOR },
    { name: 'Insertion Sort', gen: INSERTION_SORT_GENERATOR },
    { name: 'Merge Sort', gen: MERGE_SORT_GENERATOR },
    { name: 'Quick Sort', gen: QUICK_SORT_GENERATOR },
  ];

  for (const { name, gen } of generators) {
    it(`${name} sorts a basic array correctly`, () => {
      const trace = gen.generate([5, 3, 8, 1, 9, 2]);
      const result = getFinalArray(trace);
      expect(result).toEqual([1, 2, 3, 5, 8, 9]);
      expect(trace.status).toBe('completed');
    });

    it(`${name} sorts an already sorted array`, () => {
      const trace = gen.generate([1, 2, 3, 4, 5]);
      const result = getFinalArray(trace);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it(`${name} sorts a reverse sorted array`, () => {
      const trace = gen.generate([5, 4, 3, 2, 1]);
      const result = getFinalArray(trace);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it(`${name} handles a single element`, () => {
      const trace = gen.generate([42]);
      const result = getFinalArray(trace);
      expect(result).toEqual([42]);
    });

    it(`${name} handles duplicate elements`, () => {
      const trace = gen.generate([3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]);
      const result = getFinalArray(trace);
      expect(result).toEqual([1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]);
    });

    it(`${name} produces deterministic traces`, () => {
      const input = [9, 3, 7, 1, 5];
      const t1 = gen.generate(input);
      const t2 = gen.generate(input);
      expect(t1.steps.length).toBe(t2.steps.length);
      expect(t1.totalOperations).toBe(t2.totalOperations);
      expect(t1.totalComparisons).toBe(t2.totalComparisons);
      expect(t1.totalSwaps).toBe(t2.totalSwaps);
    });

    it(`${name} final state matches sorted array`, () => {
      const input = [64, 34, 25, 12, 22, 11, 90];
      const trace = gen.generate(input);
      expect(getFinalArray(trace)).toEqual([...input].sort((a, b) => a - b));
    });
  }

  it('Bubble Sort validates empty array', () => {
    const result = BUBBLE_SORT_GENERATOR.validateInput([]);
    expect(result.valid).toBe(false);
  });

  it('Bubble Sort validates non-numeric array', () => {
    const result = BUBBLE_SORT_GENERATOR.validateInput(['a', 'b']);
    expect(result.valid).toBe(false);
  });

  it('Bubble Sort rejects non-array input', () => {
    const result = BUBBLE_SORT_GENERATOR.validateInput('not an array');
    expect(result.valid).toBe(false);
  });
});

describe('Searching Generators - Correctness', () => {
  it('Linear Search finds existing element', () => {
    const trace = LINEAR_SEARCH_GENERATOR.generate({
      array: [10, 20, 30, 40, 50],
      target: 30,
    });
    expect(trace.status).toBe('completed');
    const found = trace.steps.some((s) => s.operation === 'found');
    expect(found).toBe(true);
  });

  it('Linear Search reports not found', () => {
    const trace = LINEAR_SEARCH_GENERATOR.generate({
      array: [10, 20, 30, 40, 50],
      target: 99,
    });
    const notFound = trace.steps.some((s) => s.operation === 'not-found');
    expect(notFound).toBe(true);
  });

  it('Binary Search finds existing element in sorted array', () => {
    const trace = BINARY_SEARCH_GENERATOR.generate({
      array: [10, 20, 30, 40, 50, 60, 70],
      target: 40,
    });
    expect(trace.status).toBe('completed');
    const found = trace.steps.some((s) => s.operation === 'found');
    expect(found).toBe(true);
  });

  it('Binary Search reports not found', () => {
    const trace = BINARY_SEARCH_GENERATOR.generate({
      array: [10, 20, 30, 40, 50, 60, 70],
      target: 25,
    });
    const notFound = trace.steps.some((s) => s.operation === 'not-found');
    expect(notFound).toBe(true);
  });

  it('Binary Search rejects unsorted array', () => {
    const result = BINARY_SEARCH_GENERATOR.validateInput({
      array: [30, 10, 20],
      target: 20,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('sorted');
  });

  it('Linear Search validates missing target', () => {
    const result = LINEAR_SEARCH_GENERATOR.validateInput({ array: [1, 2, 3] });
    expect(result.valid).toBe(false);
  });
});

describe('Visualization Engine', () => {
  it('registers and retrieves generators', () => {
    expect(visualizationEngine.hasGenerator('bubble-sort')).toBe(true);
    expect(visualizationEngine.hasGenerator('binary-search')).toBe(true);
    expect(visualizationEngine.hasGenerator('non-existent')).toBe(false);
  });

  it('generates trace for registered algorithm', () => {
    const result = visualizationEngine.generateTrace('bubble-sort', [3, 1, 2]);
    expect(result.trace).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(result.trace?.algorithmId).toBe('bubble-sort');
  });

  it('returns error for unregistered algorithm', () => {
    const result = visualizationEngine.generateTrace('non-existent', [1, 2, 3]);
    expect(result.trace).toBeNull();
    expect(result.error).toContain('No visualization generator');
  });

  it('returns validation error for invalid input', () => {
    const result = visualizationEngine.generateTrace('bubble-sort', []);
    expect(result.trace).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('returns registered algorithm ids', () => {
    const ids = visualizationEngine.getRegisteredAlgorithmIds();
    expect(ids).toContain('bubble-sort');
    expect(ids).toContain('selection-sort');
    expect(ids).toContain('insertion-sort');
    expect(ids).toContain('merge-sort');
    expect(ids).toContain('quick-sort');
    expect(ids).toContain('linear-search');
    expect(ids).toContain('binary-search');
  });
});

describe('StepManager', () => {
  it('navigates through steps', () => {
    const manager = new StepManager();
    const trace = BUBBLE_SORT_GENERATOR.generate([3, 1, 2]);
    manager.setTrace(trace);

    expect(manager.getNavigation().currentStepIndex).toBe(0);
    expect(manager.getNavigation().canGoNext).toBe(true);
    expect(manager.getNavigation().canGoPrevious).toBe(false);

    manager.goNext();
    expect(manager.getNavigation().currentStepIndex).toBe(1);

    manager.goToEnd();
    expect(manager.getNavigation().currentStepIndex).toBe(trace.steps.length - 1);
    expect(manager.getNavigation().canGoNext).toBe(false);

    manager.goToBeginning();
    expect(manager.getNavigation().currentStepIndex).toBe(0);

    manager.goPrevious();
    expect(manager.getNavigation().currentStepIndex).toBe(0);
    expect(manager.getNavigation().canGoPrevious).toBe(false);
  });

  it('clamps step index on goToStep', () => {
    const manager = new StepManager();
    const trace = BUBBLE_SORT_GENERATOR.generate([3, 1, 2]);
    manager.setTrace(trace);

    manager.goToStep(999);
    expect(manager.getNavigation().currentStepIndex).toBe(trace.steps.length - 1);

    manager.goToStep(-5);
    expect(manager.getNavigation().currentStepIndex).toBe(0);
  });
});

describe('ExecutionController', () => {
  it('controls playback', () => {
    const manager = new StepManager();
    const trace = BUBBLE_SORT_GENERATOR.generate([3, 1, 2]);
    manager.setTrace(trace);

    const controller = new ExecutionController(manager, { playbackSpeed: 1 });

    expect(controller.isPlayingBack()).toBe(false);
    const nav = controller.getNavigation();
    expect(nav.currentStepIndex).toBe(0);

    controller.nextStep();
    expect(controller.getNavigation().currentStepIndex).toBe(1);

    controller.previousStep();
    expect(controller.getNavigation().currentStepIndex).toBe(0);

    controller.restart();
    expect(controller.getNavigation().currentStepIndex).toBe(0);

    controller.jumpToStep(3);
    expect(controller.getNavigation().currentStepIndex).toBe(3);

    controller.dispose();
  });

  it('emits step change events', () => {
    const manager = new StepManager();
    const trace = BUBBLE_SORT_GENERATOR.generate([3, 1, 2]);
    manager.setTrace(trace);

    const controller = new ExecutionController(manager, { playbackSpeed: 1 });
    const events: string[] = [];
    controller.addListener((e) => events.push(e.type));

    controller.nextStep();
    expect(events).toContain('STEP_CHANGED');

    controller.dispose();
  });
});
