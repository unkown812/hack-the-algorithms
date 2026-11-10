import { CountingContext } from '../CountingContext';
import type { InstrumentedInput } from '../InstrumentedRunResult';

/**
 * Binary search instrumented against binary-search.c.
 * Convention see CountingConventions['binary-search'].
 * Returns the index of the target or -1 when absent (input is untouched).
 */
export function instrumentedBinarySearch(input: InstrumentedInput, context: CountingContext): number {
  const arr = input.array; // read-only: no copy required for searching
  const n = arr.length;
  const key = input.target;
  const { counter } = context;

  if (key === undefined) {
    throw new Error('binary-search requires a target value');
  }

  let low = 0;
  let high = n - 1;
  counter.incrementAssignment(2); // low, high

  while (low <= high) {
    counter.incrementArithmeticOperation(); // low + (high - low) / 2
    const mid = low + Math.floor((high - low) / 2);
    counter.incrementAssignment(); // mid

    counter.incrementLoopIteration();
    counter.incrementArrayAccess(); // read arr[mid] for the equality test
    counter.incrementComparison(); // arr[mid] == key

    if (arr[mid] === key) {
      return mid;
    } else {
      counter.incrementArrayAccess(); // read arr[mid] again for the < test
      counter.incrementComparison(); // arr[mid] < key
      if (arr[mid] < key) {
        low = mid + 1;
        counter.incrementAssignment();
      } else {
        high = mid - 1;
        counter.incrementAssignment();
      }
    }
  }

  return -1;
}
