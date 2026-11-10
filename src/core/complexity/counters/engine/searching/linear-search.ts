import { CountingContext } from '../CountingContext';
import type { InstrumentedInput } from '../InstrumentedRunResult';

/**
 * Linear search instrumented against linear-search.c.
 * Convention see CountingConventions['linear-search'].
 * Returns the index of the target or -1 when absent (input is untouched).
 */
export function instrumentedLinearSearch(input: InstrumentedInput, context: CountingContext): number {
  const arr = input.array; // read-only: no copy required for searching
  const n = arr.length;
  const key = input.target;
  const { counter } = context;

  if (key === undefined) {
    throw new Error('linear-search requires a target value');
  }

  for (let i = 0; i < n; i++) {
    counter.incrementLoopIteration();
    counter.incrementArrayAccess();
    counter.incrementComparison(); // arr[i] == key
    if (arr[i] === key) {
      return i;
    }
  }

  return -1;
}

export const SEARCH_INDEX_ABSENT = -1;
