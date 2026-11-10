import type {
  AlgorithmTrace,
  ExecutionStep,
  VisualizationState,
  VisualStateType,
  VisualStyle,
} from '../../types';
import type { TraceGenerator } from '../../engine/VisualizationEngine';
import {
  createStep,
  createVisualizationState,
  validateArrayInput,
} from './helpers';

const ALGORITHM_ID = 'quick-sort';
const ALGORITHM_NAME = 'Quick Sort';
const CATEGORY = 'sorting';

const PSEUDOCODE: string[] = [
  'function quickSort(a[], low, high):',
  '    if low < high then',
  '        pi ← partition(a, low, high)',
  '        quickSort(a, low, pi - 1)',
  '        quickSort(a, pi + 1, high)',
  '    return a',
  '',
  'function partition(a[], low, high):',
  '    pivot ← a[high]',
  '    i ← low - 1',
  '    for j ← low to high - 1 do',
  '        if a[j] <= pivot then',
  '            i ← i + 1',
  '            swap(a[i], a[j])',
  '    swap(a[i + 1], a[high])',
  '    return i + 1',
];

interface QuickSortContext {
  values: number[];
  steps: ExecutionStep[];
  stepId: number;
  comparisons: number;
  operations: number;
  swaps: number;
}

export const QUICK_SORT_GENERATOR: TraceGenerator = {
  generate(input: unknown): AlgorithmTrace {
    const validation = validateArrayInput(input);
    if (!validation.valid || !validation.values) {
      throw new Error(validation.error ?? 'Invalid input');
    }

    const values = [...validation.values];
    const n = values.length;
    const ctx: QuickSortContext = {
      values,
      steps: [],
      stepId: 0,
      comparisons: 0,
      operations: 0,
      swaps: 0,
    };

    const initialState: VisualizationState = createVisualizationState(values, {
      low: 0,
      high: n - 1,
      pivot: null,
      comparisons: 0,
      swaps: 0,
    });

    ctx.steps.push(
      createStep(
        ctx.stepId++,
        'Initialize quick sort.',
        'init',
        values,
        { low: 0, high: n - 1, pivot: null, comparisons: 0, swaps: 0 },
        { operations: 0, comparisons: 0, swaps: 0, iterations: 0 },
        {
          explanation: 'Starting quick sort. We pick a pivot, partition the array around it, then recursively sort the subarrays.',
          stateIndices: [],
        }
      )
    );

    quickSortRecursive(ctx, 0, n - 1);

    const finalState: VisualizationState = createVisualizationState(values, {
      low: 0,
      high: n - 1,
      pivot: null,
      comparisons: ctx.comparisons,
      swaps: ctx.swaps,
    });

    const lastStep = ctx.steps[ctx.steps.length - 1];
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
      lastStep.explanation = 'Quick sort complete. The array is fully sorted.';
      lastStep.operation = 'completed';
    }

    return {
      algorithmId: ALGORITHM_ID,
      algorithmName: ALGORITHM_NAME,
      category: CATEGORY,
      input: validation.values,
      steps: ctx.steps,
      initialState,
      finalState,
      totalOperations: ctx.operations,
      totalComparisons: ctx.comparisons,
      totalSwaps: ctx.swaps,
      status: 'completed',
    };
  },
  validateInput(input: unknown): { valid: boolean; error?: string } {
    const result = validateArrayInput(input);
    return { valid: result.valid, error: result.error };
  },
  getDefaultInput(): unknown {
    return [10, 7, 8, 9, 1, 5];
  },
  getPseudocode(): string[] {
    return PSEUDOCODE;
  },
};

function quickSortRecursive(ctx: QuickSortContext, low: number, high: number): void {
  if (low < high) {
    ctx.operations++;
    const pi = partition(ctx, low, high);

    ctx.steps.push(
      createStep(
        ctx.stepId++,
        `Pivot placed at index ${pi}. Left subarray: [${low}, ${pi - 1}], right subarray: [${pi + 1}, ${high}].`,
        'partition-done',
        ctx.values,
        { low, high, pivot: ctx.values[pi], comparisons: ctx.comparisons, swaps: ctx.swaps },
        {
          operations: ctx.operations,
          comparisons: ctx.comparisons,
          swaps: ctx.swaps,
          iterations: 0,
        },
        {
          lineNumber: 4,
          highlightedElements: [pi],
          stateIndices: [pi],
          explanation: `The pivot is now at its final position ${pi}. We recursively sort the left and right subarrays.`,
        }
      )
    );

    quickSortRecursive(ctx, low, pi - 1);
    quickSortRecursive(ctx, pi + 1, high);
  }
}

function partition(ctx: QuickSortContext, low: number, high: number): number {
  const pivot = ctx.values[high];
  let i = low - 1;

  ctx.steps.push(
    createStep(
      ctx.stepId++,
      `Partition: pivot = ${pivot} at index ${high}.`,
      'partition-start',
      ctx.values,
      { low, high, pivot, comparisons: ctx.comparisons, swaps: ctx.swaps },
      {
        operations: ctx.operations,
        comparisons: ctx.comparisons,
        swaps: ctx.swaps,
        iterations: 0,
      },
      {
        lineNumber: 12,
        highlightedElements: [high],
        stateIndices: [high],
        explanation: `Choosing ${pivot} (last element) as the pivot. Elements ≤ pivot go to the left.`,
      }
    )
  );

  for (let j = low; j < high; j++) {
    ctx.operations++;
    ctx.comparisons++;

    ctx.steps.push(
      createStep(
        ctx.stepId++,
        `Compare ${ctx.values[j]} (index ${j}) with pivot ${pivot}.`,
        'compare',
        ctx.values,
        { low, high, j, i, pivot, comparisons: ctx.comparisons, swaps: ctx.swaps },
        {
          operations: ctx.operations,
          comparisons: ctx.comparisons,
          swaps: ctx.swaps,
          iterations: 0,
        },
        {
          lineNumber: 14,
          comparedElements: [j, high],
          stateIndices: [j, high, i + 1],
          explanation: `Checking if ${ctx.values[j]} is less than or equal to the pivot ${pivot}.`,
        }
      )
    );

    if (ctx.values[j] <= pivot) {
      i++;
      if (i !== j) {
        const temp = ctx.values[i];
        ctx.values[i] = ctx.values[j];
        ctx.values[j] = temp;
        ctx.swaps++;
        ctx.operations++;

        ctx.steps.push(
          createStep(
            ctx.stepId++,
            `Swap ${ctx.values[j]} (index ${j}) with ${temp} (index ${i}).`,
            'swap',
            ctx.values,
            { low, high, j, i, pivot, comparisons: ctx.comparisons, swaps: ctx.swaps },
            {
              operations: ctx.operations,
              comparisons: ctx.comparisons,
              swaps: ctx.swaps,
              iterations: 0,
            },
            {
              lineNumber: 16,
              swappedElements: [i, j],
              updatedElements: [i, j],
              stateIndices: [i, j],
              explanation: `Swapping to place ${ctx.values[i]} in the left (≤ pivot) region.`,
            }
          )
        );
      }
    }
  }

  const pivotIndex = i + 1;
  if (pivotIndex !== high) {
    const temp = ctx.values[pivotIndex];
    ctx.values[pivotIndex] = ctx.values[high];
    ctx.values[high] = temp;
    ctx.swaps++;
    ctx.operations++;

    ctx.steps.push(
      createStep(
        ctx.stepId++,
        `Place pivot ${pivot} at its final position index ${pivotIndex}.`,
        'place-pivot',
        ctx.values,
        { low, high, pivot, comparisons: ctx.comparisons, swaps: ctx.swaps },
        {
          operations: ctx.operations,
          comparisons: ctx.comparisons,
          swaps: ctx.swaps,
          iterations: 0,
        },
        {
          lineNumber: 18,
          swappedElements: [pivotIndex, high],
          updatedElements: [pivotIndex, high],
          stateIndices: [pivotIndex, high],
          explanation: `Moving the pivot ${pivot} to its final sorted position at index ${pivotIndex}.`,
        }
      )
    );
  }

  return pivotIndex;
}

export default QUICK_SORT_GENERATOR;
