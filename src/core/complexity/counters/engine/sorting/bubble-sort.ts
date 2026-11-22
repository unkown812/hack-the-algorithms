import { CountingContext } from '../CountingContext';
import type { InstrumentedInput } from '../InstrumentedRunResult';

/**
 * Bubble sort instrumented against bubble-sort.c (with the early-exit flag).
 * Convention see CountingConventions['bubble-sort'].
 */
export function instrumentedBubbleSort(input: InstrumentedInput, context: CountingContext): number[] {
  const arr = [...input.array];
  const n = arr.length;
  const { counter } = context;

  for (let i = 0; i < n - 1; i++) {
    counter.incrementLoopIteration();
    let swapped = 0;
    counter.incrementAssignment(); // swapped = 0

    for (let j = 0; j < n - i - 1; j++) {
      counter.incrementLoopIteration();
      counter.incrementArrayAccess(2);
      counter.incrementComparison();
      if (arr[j] > arr[j + 1]) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swapped = 1;
        counter.incrementArrayAccess(2); // reads inside the exchange (temp + arr[j + 1])
        counter.incrementArrayWrite(2);
        counter.incrementSwap();
        counter.incrementAssignment(2); // temp assignment + swapped = 1
      }
    }

    if (swapped === 0) {
      break;
    }
  }

  return arr;
}

/** Bubble sort auxiliary bytes are O(1): only the two loop counters + flag. */
export function bubbleSortAuxiliaryBytes(): number {
  return 3 * 4; // i, j, swapped as C ints
}
