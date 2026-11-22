import { describe, expect, it } from 'vitest';
import {
  COUNTING_CONVENTIONS,
  getAllConventions,
  getConventionFor,
  runInstrumentedInput,
  validateInstrumentedInput,
} from '../../../src/core/complexity/counters/engine';
import type { OperationMetrics } from '../../../src/core/complexity/types/OperationMetrics';

const run = (algorithmId: string, array: number[], target?: number) =>
  runInstrumentedInput(algorithmId, { array, target });

describe('instrumented operation counting engine', () => {
  describe('bubble sort (mirrors bubble-sort.c)', () => {
    it('counts comparisons, swaps, writes, accesses and assignments for [5,3,8,2,1]', () => {
      const result = run('bubble-sort', [5, 3, 8, 2, 1]);

      // 4 outer passes; inner comparisons 4 + 3 + 2 + 1 = 10
      expect(result.metrics.comparisons).toBe(10);
      // 3 + 2 + 2 + 1 exchanges
      expect(result.metrics.swaps).toBe(8);
      // 2 array writes per exchange
      expect(result.metrics.arrayWrites).toBe(16);
      // 2 reads per comparison + 2 reads per exchange
      expect(result.metrics.arrayAccesses).toBe(36);
      // `swapped = 0` per pass (4) + temp and `swapped = 1` per exchange (16)
      expect(result.metrics.assignments).toBe(20);
      // outer (4) + inner (10) body executions
      expect(result.metrics.loopIterations).toBe(14);
      expect(result.output).toEqual([1, 2, 3, 5, 8]);
      expect(result.outputValid).toBe(true);
    });

    it('terminates after the first pass on sorted input (n - 1 comparisons)', () => {
      const result = run('bubble-sort', [1, 2, 3, 4, 5]);

      expect(result.metrics.comparisons).toBe(4);
      expect(result.metrics.swaps).toBe(0);
      expect(result.metrics.arrayWrites).toBe(0);
      expect(result.metrics.loopIterations).toBe(5); // 1 outer + 4 inner
      expect(result.metrics.assignments).toBe(1); // only `swapped = 0`
    });

    it('swaps on every comparison for reverse-sorted input', () => {
      const result = run('bubble-sort', [5, 4, 3, 2, 1]);

      expect(result.metrics.comparisons).toBe(10);
      expect(result.metrics.swaps).toBe(10);
      expect(result.output).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('selection sort (mirrors selection-sort.c)', () => {
    it('counts the order-independent comparison total', () => {
      const result = run('selection-sort', [5, 3, 8, 2, 1]);

      // (n-1) + (n-2) + ... + 1 = 10 comparisons, independent of input order
      expect(result.metrics.comparisons).toBe(10);
      // 4 passes corrected a position each
      expect(result.metrics.swaps).toBe(4);
      expect(result.metrics.arrayWrites).toBe(8);
      // 2 reads per comparison + 2 reads per exchange
      expect(result.metrics.arrayAccesses).toBe(28);
      // minIndex = i (4) + minIndex = j (3) + temp (4)
      expect(result.metrics.assignments).toBe(14);
      expect(result.metrics.loopIterations).toBe(14); // 4 outer + 10 inner
      expect(result.output).toEqual([1, 2, 3, 5, 8]);
    });

    it('skips the exchange when the minimum already sits at position i', () => {
      const result = run('selection-sort', [1, 2, 3]);

      expect(result.metrics.comparisons).toBe(3);
      expect(result.metrics.swaps).toBe(0);
      expect(result.metrics.arrayWrites).toBe(0);
    });
  });

  describe('insertion sort (mirrors insertion-sort.c)', () => {
    it('counts key comparisons, shift writes and scalar bookkeeping', () => {
      const result = run('insertion-sort', [5, 3, 8, 2, 1]);

      // 1 + 1 + 3 + 4 data comparisons (the `j >= 0` bound check is not a comparison)
      expect(result.metrics.comparisons).toBe(9);
      // shifts (1 + 3 + 4) + 4 final placements
      expect(result.metrics.arrayWrites).toBe(12);
      // 1 read for `key = arr[i]` per pass + 1 read of arr[j] per evaluated comparison
      expect(result.metrics.arrayAccesses).toBe(13);
      // key = arr[i] (4) + j = i - 1 (4) + j-- (8)
      expect(result.metrics.assignments).toBe(16);
      // outer (4) + while shift bodies (8)
      expect(result.metrics.loopIterations).toBe(12);
      // single-element shifts are writes, never swaps
      expect(result.metrics.swaps).toBe(0);
      expect(result.output).toEqual([1, 2, 3, 5, 8]);
    });

    it('performs only one comparison per element on sorted input', () => {
      const result = run('insertion-sort', [1, 2, 3, 4, 5]);

      expect(result.metrics.comparisons).toBe(4);
      expect(result.metrics.arrayWrites).toBe(4); // only the final placements
      expect(result.metrics.loopIterations).toBe(4); // outer only, no shifts
    });
  });

  describe('merge sort (mirrors merge-sort.c)', () => {
    it('counts the call tree as 2n - 1 nodes and n - 1 merges', () => {
      const result = run('merge-sort', [5, 3, 8, 2, 1]);
      const n = 5;

      expect(result.metrics.recursiveCalls).toBe(2 * n - 1);
      expect(result.metrics.functionCalls).toBe(n - 1);
      // one mid computation per internal node
      expect(result.metrics.arithmeticOperations).toBe(n - 1);
      // two temp arrays per merge
      expect(result.auxiliary?.allocations).toBe(2 * (n - 1));
      expect(result.auxiliary?.deallocations).toBe(n - 1);
      // peak: leftArr(3) + rightArr(2) = 5 ints = 20 bytes
      expect(result.auxiliary?.peakBytes).toBe(20);
      expect(result.auxiliary?.maxRecursionDepth).toBe(4);
      expect(result.output).toEqual([1, 2, 3, 5, 8]);
      expect(result.outputValid).toBe(true);
    });

    it('keeps the 2n - 1 / n - 1 invariants for larger inputs', () => {
      for (const n of [1, 2, 3, 8, 16]) {
        const array = Array.from({ length: n }, (_, i) => (n - i) % 7);
        const result = run('merge-sort', array);
        expect(result.metrics.recursiveCalls).toBe(2 * n - 1);
        expect(result.metrics.functionCalls).toBe(Math.max(0, n - 1));
      }
    });
  });

  describe('quick sort (mirrors quick-sort.c)', () => {
    it('counts partition comparisons, exchanges and recursive calls', () => {
      const result = run('quick-sort', [5, 3, 8, 2, 1]);

      // partition(0,4): 4, partition(1,4): 3, partition(1,2): 1
      expect(result.metrics.comparisons).toBe(8);
      // 1 final exchange + 2 inner + 1 final exchange
      expect(result.metrics.swaps).toBe(5);
      expect(result.metrics.arrayWrites).toBe(10);
      expect(result.metrics.recursiveCalls).toBe(7);
      expect(result.metrics.functionCalls).toBe(3);
      expect(result.output).toEqual([1, 2, 3, 5, 8]);
      expect(result.outputValid).toBe(true);
    });

    it('never allocates auxiliary arrays', () => {
      const result = run('quick-sort', [5, 3, 8, 2, 1]);
      expect(result.auxiliary?.allocations).toBe(0);
      expect(result.auxiliary?.peakBytes).toBe(0);
    });
  });

  describe('linear search (mirrors linear-search.c)', () => {
    it('counts one comparison and one read per examined element', () => {
      const found = run('linear-search', [5, 3, 8, 2, 1], 8);
      expect(found.metrics.comparisons).toBe(3);
      expect(found.metrics.arrayAccesses).toBe(3);
      expect(found.metrics.loopIterations).toBe(3);
      expect(found.foundIndex).toBe(2);
      expect(found.outputValid).toBe(true);

      const missing = run('linear-search', [5, 3, 8, 2, 1], 7);
      expect(missing.metrics.comparisons).toBe(5);
      expect(missing.foundIndex).toBe(-1);
    });
  });

  describe('binary search (mirrors binary-search.c)', () => {
    it('counts 2 comparisons per failed probe and 1 for the successful probe', () => {
      const result = run('binary-search', [1, 2, 3, 4, 5], 5);

      expect(result.metrics.loopIterations).toBe(3); // three probes
      expect(result.metrics.comparisons).toBe(5); // 2 + 2 + 1
      expect(result.metrics.arrayAccesses).toBe(5);
      expect(result.foundIndex).toBe(4);
      expect(result.outputValid).toBe(true);
    });

    it('reports -1 when the target is absent', () => {
      const result = run('binary-search', [1, 2, 3, 4, 5], 9);
      expect(result.foundIndex).toBe(-1);
      expect(result.metrics.comparisons).toBe(6);
      expect(result.outputValid).toBe(true);
    });

    it('requires a target value', () => {
      expect(() => run('binary-search', [1, 2, 3])).toThrow(/target/i);
      expect(() => run('linear-search', [1, 2, 3])).toThrow(/target/i);
    });
  });

  describe('engine guarantees', () => {
    it('never mutates the caller array', () => {
      const input = [5, 3, 8, 2, 1];
      const snapshot = [...input];

      run('bubble-sort', input);
      run('selection-sort', input);
      run('insertion-sort', input);
      run('merge-sort', input);
      run('quick-sort', input);

      expect(input).toEqual(snapshot);
    });

    it('is deterministic for the same input', () => {
      const first = run('merge-sort', [5, 3, 8, 2, 1]);
      const second = run('merge-sort', [5, 3, 8, 2, 1]);

      expect(second.metrics).toEqual(first.metrics);
      expect(second.output).toEqual(first.output);
    });

    it('produces sorted output with the same multiset of values', () => {
      const input = [4, 4, 1, 9, 2, 2, 7];
      const result = run('quick-sort', input);

      expect(result.output).toEqual([1, 2, 2, 4, 4, 7, 9]);
      expect(result.outputValid).toBe(true);
    });

    it('rejects invalid input explicitly instead of truncating silently', () => {
      expect(() => run('bubble-sort', [])).toThrow(/at least one element/i);
      expect(() => run('bubble-sort', [1, 'x' as unknown as number])).toThrow(/finite numbers/i);
      expect(validateInstrumentedInput({ array: [] }).valid).toBe(false);
      expect(validateInstrumentedInput({ array: [1, 2] }).valid).toBe(true);
    });

    it('throws for unknown algorithms', () => {
      expect(() => run('does-not-exist', [1, 2])).toThrow(/Unknown algorithm/);
    });
  });

  describe('counting conventions', () => {
    it('documents every instrumented algorithm', () => {
      const ids = [
        'bubble-sort',
        'selection-sort',
        'insertion-sort',
        'merge-sort',
        'quick-sort',
        'linear-search',
        'binary-search',
      ];

      for (const id of ids) {
        const convention = getConventionFor(id);
        expect(convention, `missing convention for ${id}`).toBeDefined();
        expect(convention?.summary.length ?? 0).toBeGreaterThan(10);
        expect(convention?.details.length ?? 0).toBeGreaterThan(2);
      }
      expect(getAllConventions()).toHaveLength(Object.keys(COUNTING_CONVENTIONS).length);
    });

    it('only references real counters', () => {
      const validKeys: Array<keyof OperationMetrics> = [
        'comparisons',
        'swaps',
        'assignments',
        'arrayAccesses',
        'arrayWrites',
        'loopIterations',
        'recursiveCalls',
        'functionCalls',
        'arithmeticOperations',
        'allocations',
        'deallocations',
        'totalOperations',
      ];

      for (const convention of getAllConventions()) {
        for (const key of convention.relevantCounters) {
          expect(validKeys).toContain(key);
        }
      }
    });
  });
});
