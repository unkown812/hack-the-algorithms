import type { AlgorithmTrace, ExecutionStep, VisualizationState } from '../../types';
import type { TraceGenerator } from '../../engine/VisualizationEngine';
import { validateSearchInput, createSearchStep } from './helpers';

const ALGORITHM_ID = 'binary-search';
const ALGORITHM_NAME = 'Binary Search';
const CATEGORY = 'searching';

const PSEUDOCODE: string[] = [
  'function binarySearch(a[], n, target):',
  '    low ← 0',
  '    high ← n - 1',
  '    while low <= high do',
  '        mid ← (low + high) / 2',
  '        if a[mid] == target then',
  '            return mid',
  '        else if a[mid] < target then',
  '            low ← mid + 1',
  '        else',
  '            high ← mid - 1',
  '    return -1',
];

export const BINARY_SEARCH_GENERATOR: TraceGenerator = {
  generate(input: unknown): AlgorithmTrace {
    const validation = validateSearchInput(input);
    if (!validation.valid || !validation.values || validation.target === undefined) {
      throw new Error(validation.error ?? 'Invalid input');
    }

    const values = [...validation.values];
    const target = validation.target;
    const n = values.length;
    const steps: ExecutionStep[] = [];
    let stepId = 0;
    let comparisons = 0;
    let operations = 0;

    for (let i = 1; i < n; i++) {
      if (values[i] < values[i - 1]) {
        throw new Error(
          'Binary Search requires a sorted array. The input array is not sorted.'
        );
      }
    }

    const initialState: VisualizationState = {
      array: {
        values: [...values],
        length: values.length,
        elementStyles: {},
      },
      variables: { low: 0, high: n - 1, mid: null, target, comparisons: 0 },
      stepIndex: 0,
      status: 'idle',
    };

    steps.push(
      createSearchStep(
        stepId++,
        'Initialize binary search.',
        'init',
        values,
        { low: 0, high: n - 1, mid: null, target, comparisons: 0 },
        { operations: 0, comparisons: 0 },
        {
          explanation: `Starting binary search on a sorted array. We repeatedly compare the middle element with the target ${target} and eliminate half the search range.`,
        }
      )
    );

    let low = 0;
    let high = n - 1;
    let foundIndex = -1;
    let iteration = 0;

    while (low <= high) {
      iteration++;
      operations++;
      const mid = Math.floor((low + high) / 2);

      steps.push(
        createSearchStep(
          stepId++,
          `Iteration ${iteration}: low = ${low}, high = ${high}, mid = ${mid}. Comparing ${values[mid]} with target ${target}.`,
          'compare',
          values,
          { low, high, mid, target, comparisons },
          { operations, comparisons },
          {
            lineNumber: 4,
            currentIndex: mid,
            comparedElements: [mid],
            stateIndices: [low, mid, high],
            explanation: `The middle element is ${values[mid]} at index ${mid}. Comparing it with the target ${target}.`,
          }
        )
      );

      comparisons++;

      if (values[mid] === target) {
        foundIndex = mid;
        operations++;

        steps.push(
          createSearchStep(
            stepId++,
            `Target ${target} found at index ${mid}.`,
            'found',
            values,
            { low, high, mid, target, comparisons },
            { operations, comparisons },
            {
              lineNumber: 5,
              currentIndex: mid,
              foundIndex: mid,
              comparedElements: [mid],
              explanation: `Found the target ${target} at index ${mid}. The middle element equals the target.`,
              state: 'found',
            }
          )
        );
        break;
      } else if (values[mid] < target) {
        operations++;
        const eliminatedStart = low;
        const eliminatedEnd = mid;

        steps.push(
          createSearchStep(
            stepId++,
            `${values[mid]} < ${target}, so eliminate the left half [${low}, ${mid}]. Update low = ${mid + 1}.`,
            'eliminate-left',
            values,
            { low, high, mid, target, comparisons },
            { operations, comparisons },
            {
              lineNumber: 7,
              currentIndex: mid,
              comparedElements: [mid],
              eliminatedRange: { start: eliminatedStart, end: eliminatedEnd },
              explanation: `Since ${values[mid]} is less than ${target}, the target cannot be in the left half [${low}, ${mid}]. We discard it and set low = ${mid + 1}.`,
            }
          )
        );
        low = mid + 1;
      } else {
        operations++;
        const eliminatedStart = mid;
        const eliminatedEnd = high;

        steps.push(
          createSearchStep(
            stepId++,
            `${values[mid]} > ${target}, so eliminate the right half [${mid}, ${high}]. Update high = ${mid - 1}.`,
            'eliminate-right',
            values,
            { low, high, mid, target, comparisons },
            { operations, comparisons },
            {
              lineNumber: 9,
              currentIndex: mid,
              comparedElements: [mid],
              eliminatedRange: { start: eliminatedStart, end: eliminatedEnd },
              explanation: `Since ${values[mid]} is greater than ${target}, the target cannot be in the right half [${mid}, ${high}]. We discard it and set high = ${mid - 1}.`,
            }
          )
        );
        high = mid - 1;
      }
    }

    const finalState: VisualizationState = {
      array: {
        values: [...values],
        length: values.length,
        elementStyles: {},
      },
      variables: { low, high, mid: foundIndex, target, comparisons },
      stepIndex: steps.length - 1,
      status: 'completed',
    };

    const lastStep = steps[steps.length - 1];
    if (lastStep) {
      if (foundIndex === -1) {
        lastStep.explanation = `Target ${target} was not found. The search range became empty (low > high).`;
        lastStep.operation = 'not-found';
      } else {
        lastStep.explanation = `Search complete. Target ${target} found at index ${foundIndex}.`;
        lastStep.operation = 'found';
      }
    }

    return {
      algorithmId: ALGORITHM_ID,
      algorithmName: ALGORITHM_NAME,
      category: CATEGORY,
      input: { array: values, target },
      steps,
      initialState,
      finalState,
      totalOperations: operations,
      totalComparisons: comparisons,
      totalSwaps: 0,
      status: 'completed',
    };
  },
  validateInput(input: unknown): { valid: boolean; error?: string } {
    const result = validateSearchInput(input);
    if (!result.valid) {
      return { valid: false, error: result.error };
    }
    if (!result.values) {
      return { valid: false, error: 'Invalid input.' };
    }
    for (let i = 1; i < result.values.length; i++) {
      if (result.values[i] < result.values[i - 1]) {
        return {
          valid: false,
          error:
            'Binary Search requires a sorted array. The input array is not sorted in ascending order.',
        };
      }
    }
    return { valid: true };
  },
  getDefaultInput(): unknown {
    return { array: [10, 20, 30, 40, 50, 60, 70], target: 40 };
  },
  getPseudocode(): string[] {
    return PSEUDOCODE;
  },
};

export default BINARY_SEARCH_GENERATOR;
