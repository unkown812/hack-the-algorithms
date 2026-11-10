import type { AlgorithmTrace, ExecutionStep, VisualizationState, VisualStateType, VisualStyle } from '../../types';
import type { TraceGenerator } from '../../engine/VisualizationEngine';
import {
  createStep,
  createVisualizationState,
  validateArrayInput,
} from './helpers';

const ALGORITHM_ID = 'insertion-sort';
const ALGORITHM_NAME = 'Insertion Sort';
const CATEGORY = 'sorting';

const PSEUDOCODE: string[] = [
  'function insertionSort(a[], n):',
  '    for i ← 1 to n - 1 do',
  '        key ← a[i]',
  '        j ← i - 1',
  '        while j >= 0 and a[j] > key do',
  '            a[j + 1] ← a[j]',
  '            j ← j - 1',
  '        a[j + 1] ← key',
  '    return a',
];

export const INSERTION_SORT_GENERATOR: TraceGenerator = {
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
    let shifts = 0;
    let operations = 0;

    const initialState: VisualizationState = createVisualizationState(values, {
      i: 1,
      key: null,
      j: null,
      comparisons: 0,
      swaps: 0,
    });

    steps.push(
      createStep(
        stepId++,
        'Initialize insertion sort.',
        'init',
        values,
        { i: 1, key: null, j: null, comparisons: 0, swaps: 0 },
        { operations: 0, comparisons: 0, swaps: 0, iterations: 0 },
        {
          explanation: 'Starting insertion sort. We build the sorted array one element at a time by inserting each element into its correct position.',
          stateIndices: [],
        }
      )
    );

    for (let i = 1; i < n; i++) {
      operations++;
      const key = values[i];
      let j = i - 1;

      steps.push(
        createStep(
          stepId++,
          `Pick key = ${key} at index ${i}. The sorted region is indices [0, ${i - 1}].`,
          'pick-key',
          values,
          { i, key, j, comparisons, swaps: shifts },
          { operations, comparisons, swaps: shifts, iterations: i },
          {
            lineNumber: 2,
            highlightedElements: [i],
            stateIndices: [i],
            explanation: `Taking ${key} as the key to insert into the sorted portion.`,
          }
        )
      );

      while (j >= 0 && values[j] > key) {
        comparisons++;
        operations++;

        steps.push(
          createStep(
            stepId++,
            `Shift ${values[j]} (index ${j}) to the right because it is greater than key ${key}.`,
            'shift',
            values,
            { i, key, j, comparisons, swaps: shifts },
            { operations, comparisons, swaps: shifts, iterations: i },
            {
              lineNumber: 5,
              comparedElements: [j, j + 1],
              updatedElements: [j + 1],
              stateIndices: [j, j + 1],
              explanation: `${values[j]} > ${key}, so we shift ${values[j]} one position right to make room.`,
            }
          )
        );

        values[j + 1] = values[j];
        shifts++;
        j--;

        steps.push(
          createStep(
            stepId++,
            `Moved ${values[j + 1]} to index ${j + 1}.`,
            'after-shift',
            values,
            { i, key, j, comparisons, swaps: shifts },
            { operations, comparisons, swaps: shifts, iterations: i },
            {
              lineNumber: 6,
              updatedElements: [j + 1],
              stateIndices: [j + 1],
              explanation: `Shift complete. Now comparing with element at index ${j}.`,
            }
          )
        );
      }

      if (j + 1 !== i) {
        values[j + 1] = key;
        steps.push(
          createStep(
            stepId++,
            `Insert key ${key} at index ${j + 1}.`,
            'insert-key',
            values,
            { i, key, j, comparisons, swaps: shifts },
            { operations, comparisons, swaps: shifts, iterations: i },
            {
              lineNumber: 7,
              updatedElements: [j + 1],
              stateIndices: [j + 1],
              explanation: `Placing ${key} at index ${j + 1}, its correct position in the sorted region.`,
            }
          )
        );
      } else {
        steps.push(
          createStep(
            stepId++,
            `Key ${key} is already in its correct position at index ${i}.`,
            'key-in-place',
            values,
            { i, key, j, comparisons, swaps: shifts },
            { operations, comparisons, swaps: shifts, iterations: i },
            {
              lineNumber: 7,
              highlightedElements: [i],
              stateIndices: [i],
              explanation: `No shift needed; ${key} is already correctly positioned relative to the sorted region.`,
            }
          )
        );
      }
    }

    const finalState: VisualizationState = createVisualizationState(values, {
      i: n - 1,
      key: null,
      j: null,
      comparisons,
      swaps: shifts,
    });

    const lastStep = steps[steps.length - 1];
    if (lastStep) {
      const styles: Record<number, VisualStyle> = {};
      for (let k = 0; k < values.length; k++) {
        styles[k] = { state: 'sorted' as VisualStateType };
      }
      lastStep.currentState.array = {
        values: [...values],
        length: values.length,
        elementStyles: styles,
      };
      lastStep.explanation = 'Insertion sort complete. All elements are in their final sorted positions.';
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
      totalSwaps: shifts,
      status: 'completed',
    };
  },
  validateInput(input: unknown): { valid: boolean; error?: string } {
    const result = validateArrayInput(input);
    return { valid: result.valid, error: result.error };
  },
  getDefaultInput(): unknown {
    return [12, 11, 13, 5, 6];
  },
  getPseudocode(): string[] {
    return PSEUDOCODE;
  },
};

export default INSERTION_SORT_GENERATOR;
