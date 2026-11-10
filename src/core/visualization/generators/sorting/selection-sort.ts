import type { AlgorithmTrace, ExecutionStep, VisualizationState } from '../../types';
import type { TraceGenerator } from '../../engine/VisualizationEngine';
import {
  createStep,
  createVisualizationState,
  validateArrayInput,
} from './helpers';

const ALGORITHM_ID = 'selection-sort';
const ALGORITHM_NAME = 'Selection Sort';
const CATEGORY = 'sorting';

const PSEUDOCODE: string[] = [
  'function selectionSort(a[], n):',
  '    for i ← 0 to n - 1 do',
  '        minIdx ← i',
  '        for j ← i + 1 to n - 1 do',
  '            if a[j] < a[minIdx] then',
  '                minIdx ← j',
  '        swap(a[i], a[minIdx])',
  '    return a',
];

export const SELECTION_SORT_GENERATOR: TraceGenerator = {
  generate(input: unknown): AlgorithmTrace {
    const validation = validateArrayInput(input);
    if (!validation.valid || !validation.values) {
      throw new Error(validation.error ?? 'Invalid input');
    }

    const values = [...validation.values];
    const n = values.length;
    const steps: ExecutionStep[] = [];
    let stepId = 0;
    let comparisons = 0;
    let swaps = 0;
    let operations = 0;

    const initialState: VisualizationState = createVisualizationState(values, {
      i: 0,
      minIdx: 0,
      comparisons: 0,
      swaps: 0,
    });

    steps.push(
      createStep(
        stepId++,
        'Initialize selection sort.',
        'init',
        values,
        { i: 0, minIdx: 0, comparisons: 0, swaps: 0 },
        { operations: 0, comparisons: 0, swaps: 0, iterations: 0 },
        {
          explanation: 'Starting selection sort. We repeatedly find the minimum element in the unsorted region and place it at the front.',
          stateIndices: [],
        }
      )
    );

    for (let i = 0; i < n; i++) {
      operations++;
      let minIdx = i;

      steps.push(
        createStep(
          stepId++,
          `Start pass ${i + 1}. Current minimum candidate is at index ${i} (${values[i]}).`,
          'pass-start',
          values,
          { i, minIdx, comparisons, swaps },
          { operations, comparisons, swaps, iterations: i + 1 },
          {
            lineNumber: 2,
            highlightedElements: [i],
            stateIndices: [i],
            explanation: `Assuming the element at index ${i} is the minimum in the unsorted region.`,
          }
        )
      );

      for (let j = i + 1; j < n; j++) {
        operations++;
        comparisons++;

        steps.push(
          createStep(
            stepId++,
            `Compare ${values[j]} (index ${j}) with current minimum ${values[minIdx]} (index ${minIdx}).`,
            'compare',
            values,
            { i, minIdx, j, comparisons, swaps },
            { operations, comparisons, swaps, iterations: i + 1 },
            {
              lineNumber: 4,
              comparedElements: [j, minIdx],
              stateIndices: [j, minIdx],
              explanation: `Checking if ${values[j]} is smaller than the current minimum ${values[minIdx]}.`,
            }
          )
        );

        if (values[j] < values[minIdx]) {
          const oldMin = minIdx;
          minIdx = j;
          operations++;

          steps.push(
            createStep(
              stepId++,
              `New minimum found: ${values[minIdx]} at index ${minIdx}.`,
              'update-min',
              values,
              { i, minIdx, j, comparisons, swaps },
              { operations, comparisons, swaps, iterations: i + 1 },
              {
                lineNumber: 5,
                highlightedElements: [minIdx],
                stateIndices: [minIdx],
                explanation: `${values[minIdx]} is smaller than ${values[oldMin]}, so it becomes the new minimum candidate.`,
              }
            )
          );
        }
      }

      if (minIdx !== i) {
        const beforeI = values[i];
        const beforeMin = values[minIdx];
        [values[i], values[minIdx]] = [values[minIdx], values[i]];
        swaps++;
        operations++;

        steps.push(
          createStep(
            stepId++,
            `Swap ${beforeI} (index ${i}) with ${beforeMin} (index ${minIdx}).`,
            'swap',
            values,
            { i, minIdx, comparisons, swaps },
            { operations, comparisons, swaps, iterations: i + 1 },
            {
              lineNumber: 6,
              swappedElements: [i, minIdx],
              updatedElements: [i, minIdx],
              stateIndices: [i, minIdx],
              explanation: `Placing the minimum ${beforeMin} at index ${i} by swapping it with ${beforeI}.`,
            }
          )
        );
      }

      steps.push(
        createStep(
          stepId++,
          `Pass ${i + 1} complete. Element at index ${i} (${values[i]}) is now in its final sorted position.`,
          'pass-complete',
          values,
          { i, minIdx, comparisons, swaps },
          { operations, comparisons, swaps, iterations: i + 1 },
          {
            lineNumber: 2,
            updatedElements: [i],
            stateIndices: [i],
            explanation: `The smallest element in the unsorted region is now correctly placed at index ${i}.`,
          }
        )
      );
    }

    const finalState: VisualizationState = createVisualizationState(values, {
      i: n - 1,
      minIdx: n - 1,
      comparisons,
      swaps,
    });

    const lastStep = steps[steps.length - 1];
    if (lastStep) {
      lastStep.currentState.array = {
        values: [...values],
        length: values.length,
        elementStyles: {},
      };
      for (let k = 0; k < values.length; k++) {
        lastStep.currentState.array.elementStyles[k] = { state: 'sorted' };
      }
      lastStep.explanation = 'Selection sort complete. All elements are in their final sorted positions.';
      lastStep.operation = 'completed';
    }

    return {
      algorithmId: ALGORITHM_ID,
      algorithmName: ALGORITHM_NAME,
      category: CATEGORY,
      input: validation.values,
      steps,
      initialState,
      finalState,
      totalOperations: operations,
      totalComparisons: comparisons,
      totalSwaps: swaps,
      status: 'completed',
    };
  },
  validateInput(input: unknown): { valid: boolean; error?: string } {
    const result = validateArrayInput(input);
    return { valid: result.valid, error: result.error };
  },
  getDefaultInput(): unknown {
    return [64, 25, 12, 22, 11];
  },
  getPseudocode(): string[] {
    return PSEUDOCODE;
  },
};

export default SELECTION_SORT_GENERATOR;