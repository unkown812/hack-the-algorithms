import { CountingContext } from '../CountingContext';
import type { InstrumentedInput } from '../InstrumentedRunResult';

/**
 * Insertion sort instrumented against insertion-sort.c.
 * Convention see CountingConventions['insertion-sort'].
 *
 * The C condition `j >= 0 && arr[j] > key` short-circuits: when `j >= 0` is
 * false the data comparison is never evaluated, so it is never counted.
 */
export function instrumentedInsertionSort(input: InstrumentedInput, context: CountingContext): number[] {
  const arr = [...input.array];
  const n = arr.length;
  const { counter } = context;

  for (let i = 1; i < n; i++) {
    counter.incrementLoopIteration();

    const key = arr[i];
    counter.incrementArrayAccess();
    counter.incrementAssignment(); // key = arr[i]

    let j = i - 1;
    counter.incrementAssignment(); // j = i - 1

    while (j >= 0) {
      counter.incrementArrayAccess(); // read arr[j]
      counter.incrementComparison(); // evaluate arr[j] > key
      if (arr[j] <= key) {
        break;
      }
      arr[j + 1] = arr[j];
      counter.incrementArrayWrite();
      j--;
      counter.incrementAssignment(); // j--
      counter.incrementLoopIteration(); // while body executed
    }

    arr[j + 1] = key;
    counter.incrementArrayWrite(); // final placement
  }

  return arr;
}

/** Insertion sort auxiliary bytes are O(1): i, j, key. */
export function insertionSortAuxiliaryBytes(): number {
  return 3 * 4;
}
