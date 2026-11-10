import { CountingContext } from '../CountingContext';
import type { InstrumentedInput } from '../InstrumentedRunResult';

/**
 * Merge sort instrumented against merge-sort.c (temp-array based merge).
 * Convention see CountingConventions['merge-sort'].
 */
export function instrumentedMergeSort(input: InstrumentedInput, context: CountingContext): number[] {
  const arr = [...input.array];
  const n = arr.length;

  context.enterRecursion(1);
  mergeSort(arr, 0, n - 1, context, 1);
  return arr;
}

function mergeSort(arr: number[], left: number, right: number, context: CountingContext, depth: number): void {
  const { counter } = context;
  context.enterRecursion(depth);
  counter.incrementRecursiveCall(); // mergeSort invocation (root included)

  if (left < right) {
    counter.incrementArithmeticOperation(); // mid = left + (right - left) / 2
    const mid = left + Math.floor((right - left) / 2);
    counter.incrementAssignment(); // mid = ...

    mergeSort(arr, left, mid, context, depth + 1);
    mergeSort(arr, mid + 1, right, context, depth + 1);

    counter.incrementFunctionCall(); // merge() helper invocation
    merge(arr, left, mid, right, context);
  }
}

function merge(arr: number[], left: number, mid: number, right: number, context: CountingContext): void {
  const { counter } = context;

  const n1 = mid - left + 1;
  const n2 = right - mid;
  counter.incrementAssignment(2); // n1, n2

  // int leftArr[n1], rightArr[n2]  (auxiliary storage)
  context.recordArrayAllocation(n1);
  context.recordArrayAllocation(n2);
  const leftArr = new Array<number>(n1);
  const rightArr = new Array<number>(n2);

  for (let i = 0; i < n1; i++) {
    counter.incrementLoopIteration();
    leftArr[i] = arr[left + i];
    counter.incrementArrayAccess(); // read arr[left + i]
    counter.incrementArrayWrite(); // store into temp
  }
  for (let j = 0; j < n2; j++) {
    counter.incrementLoopIteration();
    rightArr[j] = arr[mid + 1 + j];
    counter.incrementArrayAccess();
    counter.incrementArrayWrite();
  }

  let i = 0, j = 0, k = left;
  counter.incrementAssignment(3); // i, j, k initialisation

  while (i < n1 && j < n2) {
    counter.incrementComparison(); // leftArr[i] <= rightArr[j]
    counter.incrementArrayAccess(); // read from the temp arrays
    if (leftArr[i] <= rightArr[j]) {
      arr[k] = leftArr[i];
      i++;
    } else {
      arr[k] = rightArr[j];
      j++;
    }
    counter.incrementArrayWrite();
    k++;
    counter.incrementLoopIteration();
  }

  while (i < n1) {
    counter.incrementArrayAccess();
    arr[k] = leftArr[i];
    counter.incrementArrayWrite();
    i++;
    k++;
    counter.incrementLoopIteration();
  }

  while (j < n2) {
    counter.incrementArrayAccess();
    arr[k] = rightArr[j];
    counter.incrementArrayWrite();
    j++;
    k++;
    counter.incrementLoopIteration();
  }

  // leftArr / rightArr go out of scope in C (VLA storage released)
  context.recordArrayDeallocation();
}
