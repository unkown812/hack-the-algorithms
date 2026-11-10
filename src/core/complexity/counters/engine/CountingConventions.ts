/**
 * Counting conventions for the instrumented operation-counting engine.
 *
 * Every instrumented implementation mirrors the phase-3 C implementation in
 * `src/core/code-data` statement-for-statement. Counts are therefore
 * deterministic and reusable across runs for the same input.
 *
 * Rules that apply to every algorithm unless stated otherwise:
 * - `comparisons` counts value comparisons between *data* elements
 *   (array element vs element, or element vs key). Index bound checks such as
 *   `j >= 0` or `i < n` are NOT counted as comparisons; loop bookkeeping is
 *   tracked through `loopIterations`.
 * - `arrayAccesses` counts each read of an array element, including reads from
 *   auxiliary/temporary arrays (documented per algorithm).
 * - `arrayWrites` counts each write into any array (main or auxiliary).
 * - A `swap` is one exchange of two array elements; its two reads and two
 *   writes are tracked separately under `arrayAccesses`/`arrayWrites`, and the
 *   temporary scalar (`int temp = ...`) is tracked under `assignments`.
 * - `assignments` counts the scalar assignments explicitly listed in each
 *   algorithm's convention below. Loop-counter updates (`i++`) are excluded
 *   because they are represented by `loopIterations`.
 * - Counters that do not apply to an algorithm remain 0 (they are
 *   "unsupported" for that algorithm, not "zero happened").
 */

export interface CountingConvention {
  algorithmId: string;
  summary: string;
  /** Counters this algorithm actually uses; others are shown as not applicable. */
  relevantCounters: Array<keyof import('../../types/OperationMetrics').OperationMetrics>;
  details: string[];
}

export const COUNTING_CONVENTIONS: Record<string, CountingConvention> = {
  'bubble-sort': {
    algorithmId: 'bubble-sort',
    summary: 'Counts adjacent-element comparisons, swaps, array writes and scalar assignments exactly as written in the C implementation.',
    relevantCounters: ['comparisons', 'swaps', 'assignments', 'arrayAccesses', 'arrayWrites', 'loopIterations'],
    details: [
      'comparisons: each evaluation of `arr[j] > arr[j + 1]` (1 per inner-loop iteration).',
      'arrayAccesses: 2 reads per comparison, plus 2 more reads per executed exchange.',
      'swaps: 1 per exchange. Each exchange also adds 2 arrayWrites and 1 assignment (the temp variable).',
      'assignments: `swapped = 0` at the start of each pass, `swapped = 1` on every swap, and the temp variable of every swap.',
      'arrayWrites: 2 per swap.',
      'loopIterations: every body execution of the outer and the inner loop.',
    ],
  },
  'selection-sort': {
    algorithmId: 'selection-sort',
    summary: 'Counts inner-loop comparisons, recorded minimum-index reassignments and the final swap of each pass.',
    relevantCounters: ['comparisons', 'swaps', 'assignments', 'arrayAccesses', 'arrayWrites', 'loopIterations'],
    details: [
      'comparisons: each evaluation of `arr[j] < arr[minIndex]`.',
      'arrayAccesses: 2 reads per comparison, plus 2 more reads per executed exchange.',
      'assignments: `minIndex = i` per pass, each `minIndex = j` update, and the temp variable of each swap.',
      'swaps: only executed when `minIndex != i` (the self-swap is skipped, as in C). Each swap adds 2 arrayWrites.',
      'loopIterations: every outer-loop and inner-loop body execution.',
    ],
  },
  'insertion-sort': {
    algorithmId: 'insertion-sort',
    summary: 'Counts key comparisons during the shifting while-loop, shift writes and scalar bookkeeping.',
    relevantCounters: ['comparisons', 'assignments', 'arrayAccesses', 'arrayWrites', 'loopIterations'],
    details: [
      'comparisons: each evaluation of `arr[j] > key`. The short-circuit `j >= 0` index check is not a data comparison.',
      'arrayAccesses: 1 read for `key = arr[i]` plus 1 read of `arr[j]` for every executed or evaluated compare.',
      'arrayWrites: 1 per shift (`arr[j + 1] = arr[j]`) plus the final `arr[j + 1] = key` placement write.',
      'assignments: `key = arr[i]`, `j = i - 1`, and each `j--` inside the while-loop.',
      'swaps: always 0 (shifts are single-element writes, not swaps).',
      'loopIterations: every outer-loop body execution plus every executed while-loop shift body.',
    ],
  },
  'merge-sort': {
    algorithmId: 'merge-sort',
    summary: 'Counts merge comparisons, temp-copy traffic, recursive call-tree invocations and temp-array allocations.',
    relevantCounters: ['comparisons', 'assignments', 'arrayAccesses', 'arrayWrites', 'loopIterations', 'recursiveCalls', 'functionCalls', 'arithmeticOperations', 'allocations', 'deallocations'],
    details: [
      'recursiveCalls: every invocation of mergeSort on the call tree, including the root (a size-n tree has 2n-1 nodes).',
      'functionCalls: every invocation of the merge() helper (one per internal node, n-1 for size-n arrays).',
      'comparisons: each evaluation of `leftArr[i] <= rightArr[j]` in the merge while-loop.',
      'arrayAccesses: reads from arr while copying to the temp arrays (n1 + n2 per merge) and one read per merged element written back to arr.',
      'arrayWrites: stores into the temp arrays (n1 + n2 per merge) and one per element written back into arr.',
      'assignments: per merge: n1, n2, i, j, k leaves (5 scalars); per mergeSort call above a leaf: mid. Copy/merge loop counters are represented by loopIterations.',
      'arithmeticOperations: 1 per mid computation (n = left + (right - left) / 2).',
      'allocations/deallocations: 2 temp arrays created and released per merge; estimated aux bytes use 4 bytes per int element at their peak.',
    ],
  },
  'quick-sort': {
    algorithmId: 'quick-sort',
    summary: 'Counts partition comparisons, partition exchanges, recursive call-tree invocations and scalar bookkeeping.',
    relevantCounters: ['comparisons', 'swaps', 'assignments', 'arrayAccesses', 'arrayWrites', 'loopIterations', 'recursiveCalls', 'functionCalls', 'allocations'],
    details: [
      'recursiveCalls: every invocation of quickSort on the call tree, including the root.',
      'functionCalls: every invocation of partition() (one per non-leaf recursive call).',
      'comparisons: each evaluation of `arr[j] <= pivot` in the partition loop.',
      'arrayAccesses: 1 read for the pivot (`arr[high]`), 1 read of `arr[j]` per partition-loop iteration, plus 2 reads per executed exchange, plus 2 reads for the final pivot exchange.',
      'swaps: partitions already swap in place when `arr[j] <= pivot`, plus 1 final exchange moving the pivot to position `i + 1`.',
      'assignments: i = low - 1, each i++ inside the loop, temp variables of exchanges, and j is tracked by loopIterations.',
      'allocations: quick sort allocates no auxiliary arrays; temp exchanges live in scalars.',
      'loops in partition are represented through loopIterations.',
    ],
  },
  'linear-search': {
    algorithmId: 'linear-search',
    summary: 'Counts one comparison and one array read per examined element.',
    relevantCounters: ['comparisons', 'assignments', 'arrayAccesses', 'loopIterations'],
    details: [
      'comparisons: each evaluation of `arr[i] == key`.',
      'arrayAccesses: 1 read per examined element.',
      'loopIterations: loop body executions only; the final failing `i < n` bound check is not a comparison.',
      'assignments: linear search assigns no scalars in its core loop (the loop counter update is represented by loopIterations); for the standard C implementation this counter stays 0.',
    ],
  },
  'binary-search': {
    algorithmId: 'binary-search',
    summary: 'Counts comparisons evaluated per probe (1 or 2), mid index assignments and bound updates.',
    relevantCounters: ['comparisons', 'assignments', 'arrayAccesses', 'loopIterations'],
    details: [
      'comparisons: each evaluation of `arr[mid] == key` and, when the equality test fails, each evaluation of `arr[mid] < key`. A probe therefore costs 1 comparison when it finds the key, otherwise 2.',
      'arrayAccesses: 1 read when the equality test succeeds, 2 reads (`arr[mid]` twice) when it fails.',
      'assignments: `low = 0`, `high = n - 1`, `mid = ...` per probe and each `low = mid + 1` or `high = mid - 1` update.',
      'loopIterations: while-loop body executions (one per probe).',
    ],
  },
};

export function getConventionFor(algorithmId: string): CountingConvention | undefined {
  return COUNTING_CONVENTIONS[algorithmId];
}

export function getAllConventions(): CountingConvention[] {
  return Object.values(COUNTING_CONVENTIONS);
}
