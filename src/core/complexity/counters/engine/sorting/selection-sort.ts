import { CountingContext } from '../CountingContext';
import type { InstrumentedInput } from '../InstrumentedRunResult';

/**
 * Selection sort instrumented against selection-sort.c.
 * Convention see CountingConventions['selection-sort'].
 */
export function instrumentedSelectionSort(input: InstrumentedInput, context: CountingContext): number[] {
  const arr = [...input.array];
  const n = arr.length;
  const { counter } = context;

  for (let i = 0; i < n - 1; i++) {
    counter.incrementLoopIteration();
    let minIndex = i;
    counter.incrementAssignment(); // minIndex = i

    for (let j = i + 1; j < n; j++) {
      counter.incrementLoopIteration();
      counter.incrementArrayAccess(2);
      counter.incrementComparison();
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
        counter.incrementAssignment();
      }
    }

    if (minIndex !== i) {
      const temp = arr[minIndex];
      arr[minIndex] = arr[i];
      arr[i] = temp;
      counter.incrementArrayAccess(2);
      counter.incrementArrayWrite(2);
      counter.incrementSwap();
      counter.incrementAssignment(); // temp
    }
  }

  return arr;
}

/** Selection sort auxiliary bytes are O(1): i, j, minIndex, temp. */
export function selectionSortAuxiliaryBytes(): number {
  return 3 * 4;
}
