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

const ALGORITHM_ID = 'merge-sort';
const ALGORITHM_NAME = 'Merge Sort';
const CATEGORY = 'sorting';

const PSEUDOCODE: string[] = [
  'function mergeSort(a[], left, right):',
  '    if left < right then',
  '        mid ← (left + right) / 2',
  '        mergeSort(a, left, mid)',
  '        mergeSort(a, mid + 1, right)',
  '        merge(a, left, mid, right)',
  '    return a',
];

interface MergeSortContext {
  values: number[];
  steps: ExecutionStep[];
  stepId: number;
  comparisons: number;
  operations: number;
}

export const MERGE_SORT_GENERATOR: TraceGenerator = {
  generate(input: unknown): AlgorithmTrace {
    const validation = validateArrayInput(input);
    if (!validation.valid || !validation.values) {
      throw new Error(validation.error ?? 'Invalid input');
    }

    const values = [...validation.values];
    const n = values.length;
    const ctx: MergeSortContext = {
      values,
      steps: [],
      stepId: 0,
      comparisons: 0,
      operations: 0,
    };

    const initialState: VisualizationState = createVisualizationState(values, {
      left: 0,
      right: n - 1,
      comparisons: 0,
      swaps: 0,
    });

    ctx.steps.push(
      createStep(
        ctx.stepId++,
        'Initialize merge sort.',
        'init',
        values,
        { left: 0, right: n - 1, comparisons: 0, swaps: 0 },
        { operations: 0, comparisons: 0, swaps: 0, iterations: 0 },
        {
          explanation: 'Starting merge sort. We divide the array into halves, sort each half, then merge them back together.',
          stateIndices: [],
        }
      )
    );

    mergeSortRecursive(ctx, 0, n - 1);

    const finalState: VisualizationState = createVisualizationState(values, {
      left: 0,
      right: n - 1,
      comparisons: ctx.comparisons,
      swaps: 0,
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
      lastStep.explanation = 'Merge sort complete. The array is fully sorted.';
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
      totalSwaps: 0,
      status: 'completed',
    };
  },
  validateInput(input: unknown): { valid: boolean; error?: string } {
    const result = validateArrayInput(input);
    return { valid: result.valid, error: result.error };
  },
  getDefaultInput(): unknown {
    return [38, 27, 43, 3, 9, 82, 10];
  },
  getPseudocode(): string[] {
    return PSEUDOCODE;
  },
};

function mergeSortRecursive(ctx: MergeSortContext, left: number, right: number): void {
  if (left >= right) {return;}

  ctx.operations++;
  const mid = Math.floor((left + right) / 2);

  ctx.steps.push(
    createStep(
      ctx.stepId++,
      `Divide: splitting range [${left}, ${right}] at mid = ${mid}.`,
      'divide',
      ctx.values,
      { left, right, mid, comparisons: ctx.comparisons, swaps: 0 },
      {
        operations: ctx.operations,
        comparisons: ctx.comparisons,
        swaps: 0,
        iterations: 0,
      },
      {
        lineNumber: 3,
        highlightedElements: [left, mid, right],
        stateIndices: [left, mid, right],
        explanation: `Dividing the range [${left}, ${right}] into [${left}, ${mid}] and [${mid + 1}, ${right}].`,
      }
    )
  );

  mergeSortRecursive(ctx, left, mid);
  mergeSortRecursive(ctx, mid + 1, right);

  merge(ctx, left, mid, right);
}

function merge(ctx: MergeSortContext, left: number, mid: number, right: number): void {
  const leftArr = ctx.values.slice(left, mid + 1);
  const rightArr = ctx.values.slice(mid + 1, right + 1);
  let i = 0;
  let j = 0;
  let k = left;

  ctx.steps.push(
    createStep(
      ctx.stepId++,
      `Merge: combining sorted subarrays [${left}, ${mid}] and [${mid + 1}, ${right}].`,
      'merge-start',
      ctx.values,
      { left, right, mid, comparisons: ctx.comparisons, swaps: 0 },
      {
        operations: ctx.operations,
        comparisons: ctx.comparisons,
        swaps: 0,
        iterations: 0,
      },
      {
        lineNumber: 6,
        stateIndices: [...Array(right - left + 1).keys()].map((x) => x + left),
        explanation: `Merging two sorted subarrays back into the range [${left}, ${right}].`,
      }
    )
  );

  while (i < leftArr.length && j < rightArr.length) {
    ctx.operations++;
    ctx.comparisons++;

    ctx.steps.push(
      createStep(
        ctx.stepId++,
        `Compare ${leftArr[i]} (left subarray) with ${rightArr[j]} (right subarray).`,
        'compare',
        ctx.values,
        { left, right, mid, i, j, k, comparisons: ctx.comparisons, swaps: 0 },
        {
          operations: ctx.operations,
          comparisons: ctx.comparisons,
          swaps: 0,
          iterations: 0,
        },
        {
          lineNumber: 7,
          comparedElements: [left + i, mid + 1 + j],
          stateIndices: [left + i, mid + 1 + j, k],
          explanation: `Choosing the smaller of ${leftArr[i]} and ${rightArr[j]} to place at index ${k}.`,
        }
      )
    );

    if (leftArr[i] <= rightArr[j]) {
      ctx.values[k] = leftArr[i];
      i++;
    } else {
      ctx.values[k] = rightArr[j];
      j++;
    }
    k++;

    ctx.steps.push(
      createStep(
        ctx.stepId++,
        `Placed value at index ${k - 1}.`,
        'place',
        ctx.values,
        { left, right, mid, i, j, k, comparisons: ctx.comparisons, swaps: 0 },
        {
          operations: ctx.operations,
          comparisons: ctx.comparisons,
          swaps: 0,
          iterations: 0,
        },
        {
          lineNumber: 9,
          updatedElements: [k - 1],
          stateIndices: [k - 1],
          explanation: `The smaller element has been placed at index ${k - 1}.`,
        }
      )
    );
  }

  while (i < leftArr.length) {
    ctx.values[k] = leftArr[i];
    i++;
    k++;
    ctx.operations++;

    ctx.steps.push(
      createStep(
        ctx.stepId++,
        `Copy remaining element ${leftArr[i - 1]} to index ${k - 1}.`,
        'copy-remaining',
        ctx.values,
        { left, right, mid, i, j, k, comparisons: ctx.comparisons, swaps: 0 },
        {
          operations: ctx.operations,
          comparisons: ctx.comparisons,
          swaps: 0,
          iterations: 0,
        },
        {
          lineNumber: 11,
          updatedElements: [k - 1],
          stateIndices: [k - 1],
          explanation: `Copying the remaining element ${leftArr[i - 1]} from the left subarray.`,
        }
      )
    );
  }

  while (j < rightArr.length) {
    ctx.values[k] = rightArr[j];
    j++;
    k++;
    ctx.operations++;

    ctx.steps.push(
      createStep(
        ctx.stepId++,
        `Copy remaining element ${rightArr[j - 1]} to index ${k - 1}.`,
        'copy-remaining',
        ctx.values,
        { left, right, mid, i, j, k, comparisons: ctx.comparisons, swaps: 0 },
        {
          operations: ctx.operations,
          comparisons: ctx.comparisons,
          swaps: 0,
          iterations: 0,
        },
        {
          lineNumber: 13,
          updatedElements: [k - 1],
          stateIndices: [k - 1],
          explanation: `Copying the remaining element ${rightArr[j - 1]} from the right subarray.`,
        }
      )
    );
  }

  ctx.steps.push(
    createStep(
      ctx.stepId++,
      `Merge complete for range [${left}, ${right}].`,
      'merge-complete',
      ctx.values,
      { left, right, mid, comparisons: ctx.comparisons, swaps: 0 },
      {
        operations: ctx.operations,
        comparisons: ctx.comparisons,
        swaps: 0,
        iterations: 0,
      },
      {
        lineNumber: 6,
        stateIndices: [...Array(right - left + 1).keys()].map((x) => x + left),
        explanation: `The range [${left}, ${right}] is now sorted.`,
      }
    )
  );
}

export default MERGE_SORT_GENERATOR;
