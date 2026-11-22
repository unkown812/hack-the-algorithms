import type { AlgorithmTrace, ExecutionStep, VisualizationState } from '../../types';
import type { TraceGenerator } from '../../engine/VisualizationEngine';
import {
  createStep,
  createArrayStyle,
  createVisualizationState,
  validateArrayInput,
} from './helpers';

const ALGORITHM_ID = 'bubble-sort';
const ALGORITHM_NAME = 'Bubble Sort';
const CATEGORY = 'sorting';

const PSEUDOCODE: string[] = [
  'function bubbleSort(a[], n):',
  '    for i ← 0 to n - 1 do',
  '        for j ← 0 to n - i - 2 do',
  '            if a[j] > a[j + 1] then',
  '                swap(a[j], a[j + 1])',
  '    return a',
];

export const BUBBLE_SORT_GENERATOR: TraceGenerator = {
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
      j: 0,
      comparisons: 0,
      swaps: 0,
    });

    steps.push(
      createStep(
        stepId++,
        'Initialize bubble sort with the input array.',
        'init',
        values,
        { i: 0, j: 0, comparisons: 0, swaps: 0 },
        { operations: 0, comparisons: 0, swaps: 0, iterations: 0 },
        {
          explanation: 'Starting bubble sort. We will repeatedly compare adjacent elements and swap them if they are out of order.',
          stateIndices: [],
        }
      )
    );

    for (let i = 0; i < n; i++) {
      operations++;
      for (let j = 0; j < n - i - 1; j++) {
        operations++;
        comparisons++;

        const before = [...values];

        steps.push(
          createStep(
            stepId++,
            `Compare elements at index ${j} (${values[j]}) and ${j + 1} (${values[j + 1]}).`,
            'compare',
            values,
            { i, j, comparisons, swaps },
            {
              operations,
              comparisons,
              swaps,
              iterations: i + 1,
            },
            {
              lineNumber: 3,
              comparedElements: [j, j + 1],
              stateIndices: [j, j + 1],
              explanation: `Comparing ${values[j]} (index ${j}) with ${values[j + 1]} (index ${j + 1}).`,
            }
          )
        );

        if (values[j] > values[j + 1]) {
          [values[j], values[j + 1]] = [values[j + 1], values[j]];
          swaps++;
          operations++;

          steps.push(
            createStep(
              stepId++,
              `Swap ${before[j]} and ${before[j + 1]} because ${before[j]} > ${before[j + 1]}.`,
              'swap',
              values,
              { i, j, comparisons, swaps },
              {
                operations,
                comparisons,
                swaps,
                iterations: i + 1,
              },
              {
                lineNumber: 4,
                swappedElements: [j, j + 1],
                updatedElements: [j, j + 1],
                stateIndices: [j, j + 1],
                explanation: `Swapping ${before[j]} and ${before[j + 1]} because the left element is greater than the right.`,
              }
            )
          );
        }
      }
      // Mark the last unsorted element as sorted after each pass
      const sortedIndex = n - 1 - i;
      steps.push(
        createStep(
          stepId++,
          `Pass ${i + 1} complete. Element at index ${sortedIndex} (${values[sortedIndex]}) is now in its final sorted position.`,
          'pass-complete',
          values,
          { i, j: n - i - 1, comparisons, swaps },
          {
            operations,
            comparisons,
            swaps,
            iterations: i + 1,
          },
          {
            lineNumber: 2,
            updatedElements: [sortedIndex],
            stateIndices: [sortedIndex],
            explanation: `After pass ${i + 1}, the largest unsorted element has bubbled to index ${sortedIndex}.`,
          }
        )
      );
    }

    const finalState: VisualizationState = createVisualizationState(values, {
      i: n - 1,
      j: 0,
      comparisons,
      swaps,
    });

    // Mark all elements sorted in the final step
    const lastStep = steps[steps.length - 1];
    if (lastStep) {
      lastStep.currentState.array = {
        values: [...values],
        length: values.length,
        elementStyles: createArrayStyle(values, 'sorted'),
      };
      lastStep.explanation =
        'Bubble sort complete. All elements are in their final sorted positions.';
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
    return [64, 34, 25, 12, 22, 11, 90];
  },
  getPseudocode(): string[] {
    return PSEUDOCODE;
  },
};

export default BUBBLE_SORT_GENERATOR;
