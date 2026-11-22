import { CountingContext } from '../CountingContext';
import type { InstrumentedInput } from '../InstrumentedRunResult';

/**
 * Quick sort instrumented against quick-sort.c (Lomuto partition, last-element pivot).
 * Convention see CountingConventions['quick-sort'].
 */
export function instrumentedQuickSort(input: InstrumentedInput, context: CountingContext): number[] {
  const arr = [...input.array];
  const n = arr.length;

  context.enterRecursion(1);
  quickSort(arr, 0, n - 1, context, 1);
  return arr;
}

function quickSort(arr: number[], low: number, high: number, context: CountingContext, depth: number): void {
  const { counter } = context;
  context.enterRecursion(depth);
  counter.incrementRecursiveCall(); // quickSort invocation (root included)

  if (low < high) {
    counter.incrementFunctionCall();
    const pi = partition(arr, low, high, context);

    quickSort(arr, low, pi - 1, context, depth + 1);
    quickSort(arr, pi + 1, high, context, depth + 1);
  }
}

function partition(arr: number[], low: number, high: number, context: CountingContext): number {
  const { counter } = context;

  const pivot = arr[high];
  counter.incrementArrayAccess();
  counter.incrementAssignment(); // pivot = arr[high]

  let i = low - 1;
  counter.incrementAssignment(); // i = low - 1

  for (let j = low; j <= high - 1; j++) {
    counter.incrementLoopIteration();
    counter.incrementArrayAccess(); // read arr[j]
    counter.incrementComparison(); // arr[j] <= pivot
    if (arr[j] <= pivot) {
      i++;
      counter.incrementAssignment(); // i++

      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
      counter.incrementArrayAccess(2);
      counter.incrementArrayWrite(2);
      counter.incrementSwap();
      counter.incrementAssignment(); // temp
    }
  }

  // final pivot placement exchange
  const temp = arr[i + 1];
  arr[i + 1] = arr[high];
  arr[high] = temp;
  counter.incrementArrayAccess(2);
  counter.incrementArrayWrite(2);
  counter.incrementSwap();
  counter.incrementAssignment(); // temp

  return i + 1;
}

/** Quick sort allocates no auxiliary arrays; only recursion depth depends on n. */
export function quickSortMaxStackDepth(n: number): number {
  if (n <= 1) {return 1;}
  return Math.ceil(Math.log2(Math.max(1, n))) + 1;
}
