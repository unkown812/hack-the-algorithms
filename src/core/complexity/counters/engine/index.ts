import { getAlgorithmById, getAlgorithmsByCategory } from '../../../algorithms/registry';
import { CountingContext } from './CountingContext';
import { instrumentedBubbleSort } from './sorting/bubble-sort';
import { instrumentedSelectionSort } from './sorting/selection-sort';
import { instrumentedInsertionSort } from './sorting/insertion-sort';
import { instrumentedMergeSort } from './sorting/merge-sort';
import { instrumentedQuickSort } from './sorting/quick-sort';
import { instrumentedLinearSearch } from './searching/linear-search';
import { instrumentedBinarySearch } from './searching/binary-search';
import type { InstrumentedInput, InstrumentedRunResult } from './InstrumentedRunResult';
import { bubbleSortAuxiliaryBytes } from './sorting/bubble-sort';
import { selectionSortAuxiliaryBytes } from './sorting/selection-sort';
import { insertionSortAuxiliaryBytes } from './sorting/insertion-sort';

export * from './InstrumentedRunResult';
export { CountingContext, INT_SIZE_BYTES } from './CountingContext';
export type { AllocationSummary } from './CountingContext';
export { COUNTING_CONVENTIONS, getConventionFor, getAllConventions } from './CountingConventions';
export type { CountingConvention } from './CountingConventions';
export { instrumentedBubbleSort, instrumentedSelectionSort, instrumentedInsertionSort, instrumentedMergeSort, instrumentedQuickSort, instrumentedLinearSearch, instrumentedBinarySearch };

/**
 * Category ids as used by the algorithm registry. Comparisons are made
 * case-insensitively so display labels ("Sorting") and registry ids
 * ("sorting") can be used interchangeably.
 */
export const SEARCHING_CATEGORY = 'searching';
export const SORTING_CATEGORY = 'sorting';

export function isSearchingAlgorithm(algorithmId: string): boolean {
  const algorithm = getAlgorithmById(algorithmId);
  return algorithm?.category.toLowerCase() === SEARCHING_CATEGORY;
}

export function isSortingAlgorithm(algorithmId: string): boolean {
  const algorithm = getAlgorithmById(algorithmId);
  return algorithm?.category.toLowerCase() === SORTING_CATEGORY;
}

export interface InstrumentedValidation {
  valid: boolean;
  error?: string;
  values?: number[];
}

export function validateInstrumentedInput(input: InstrumentedInput): InstrumentedValidation {
  if (!input || !Array.isArray(input.array)) {
    return { valid: false, error: 'Input must contain an array of numbers.' };
  }
  if (input.array.some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
    return { valid: false, error: 'All array elements must be finite numbers.' };
  }
  if (input.array.length === 0) {
    return { valid: false, error: 'Array must contain at least one element.' };
  }
  return { valid: true, values: input.array };
}

function isSortedAscending(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i - 1] > arr[i]) {
      return false;
    }
  }
  return true;
}

function multisetEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {return false;}
  const counts = new Map<number, number>();
  for (const v of a) {counts.set(v, (counts.get(v) ?? 0) + 1);}
  for (const v of b) {
    const c = counts.get(v) ?? 0;
    if (c === 0) {return false;}
    counts.set(v, c - 1);
  }
  return true;
}

/** Per-algorithm fixed O(1) auxiliary byte estimates matching the C locals. */
export const FIXED_AUXILIARY_BYTES: Record<string, number> = {
  'bubble-sort': bubbleSortAuxiliaryBytes(),
  'selection-sort': selectionSortAuxiliaryBytes(),
  'insertion-sort': insertionSortAuxiliaryBytes(),
  'linear-search': 2 * 4, // i, key
  'binary-search': 3 * 4, // low, high, mid
};

/**
 * Run one deterministic, instrumented execution of a supported algorithm.
 * Mirrors the phase-3 C implementation statements and counts operations with
 * OperationCounter. The caller's array is never mutated.
 */
export function runInstrumentedInput(
  algorithmId: string,
  input: InstrumentedInput
): InstrumentedRunResult {
  const algorithm = getAlgorithmById(algorithmId);
  if (!algorithm) {
    throw new Error(`Unknown algorithm: ${algorithmId}`);
  }

  const validation = validateInstrumentedInput(input);
  if (!validation.valid) {
    throw new Error(validation.error ?? 'Invalid input');
  }

  const context = new CountingContext();
  let output: number[] = [];
  let foundIndex: number | undefined;
  let outputValid: boolean;

  switch (algorithmId) {
  case 'bubble-sort':
    output = instrumentedBubbleSort(input, context);
    outputValid = isSortedAscending(output) && multisetEqual(output, input.array);
    break;
  case 'selection-sort':
    output = instrumentedSelectionSort(input, context);
    outputValid = isSortedAscending(output) && multisetEqual(output, input.array);
    break;
  case 'insertion-sort':
    output = instrumentedInsertionSort(input, context);
    outputValid = isSortedAscending(output) && multisetEqual(output, input.array);
    break;
  case 'merge-sort':
    output = instrumentedMergeSort(input, context);
    outputValid = isSortedAscending(output) && multisetEqual(output, input.array);
    break;
  case 'quick-sort':
    output = instrumentedQuickSort(input, context);
    outputValid = isSortedAscending(output) && multisetEqual(output, input.array);
    break;
  case 'linear-search':
    foundIndex = instrumentedLinearSearch(input, context);
    output = [...input.array];
    outputValid = foundIndex === -1 || input.array[foundIndex] === input.target;
    break;
  case 'binary-search':
    foundIndex = instrumentedBinarySearch(input, context);
    output = [...input.array];
    outputValid = foundIndex === -1 || input.array[foundIndex] === input.target;
    break;
  default:
    throw new Error(`No instrumented implementation for: ${algorithmId}`);
  }

  const auxiliary = context.getAllocationSummary();

  return {
    algorithmId,
    inputSize: input.array.length,
    scenario: input.scenario,
    output,
    foundIndex,
    outputValid,
    metrics: context.counter.getMetrics(),
    auxiliary,
  };
}

export function getInstrumentedAlgorithmIds(): string[] {
  return getAlgorithmsByCategory(SEARCHING_CATEGORY)
    .concat(getAlgorithmsByCategory(SORTING_CATEGORY))
    .map((a) => a.id);
}
