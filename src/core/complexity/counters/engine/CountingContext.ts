import { OperationCounter } from '../OperationCounter';
import { DEFAULT_COUNTING_POLICY } from '../CountingPolicy';
import { AllocationTracker, AllocationRecord } from '../../space/AllocationTracker';
import type { OperationMetrics } from '../../types/OperationMetrics';

export interface AllocationSummary {
  allocations: number;
  deallocations: number;
  /** Peak auxiliary bytes held at the same time (4 bytes per C int element). */
  peakBytes: number;
  /** Maximum recursion depth reached during the run (1 for iterative runs). */
  maxRecursionDepth: number;
}

export const INT_SIZE_BYTES = 4;

export interface CountingOptions {
  /** Destructive counting runs on a defensive copy of the caller's array. */
  trackAllocations?: boolean;
}

/**
 * Shared bookkeeping for one instrumented algorithm execution.
 * Mirrors the C implementations statement-for-statement so counts stay
 * deterministic for a given input.
 */
export class CountingContext {
  readonly counter: OperationCounter;
  readonly tracker: AllocationTracker;
  maxRecursionDepth: number;

  constructor(options: CountingOptions = {}) {
    this.counter = new OperationCounter(DEFAULT_COUNTING_POLICY);
    this.tracker = new AllocationTracker();
    this.maxRecursionDepth = 0;
    void options;
  }

  /** Bump the recursion depth when entering a recursive implementation frame. */
  enterRecursion(depth: number): void {
    if (depth > this.maxRecursionDepth) {
      this.maxRecursionDepth = depth;
    }
  }

  /** Record an auxiliary array allocation (C int elements on the heap/VLA). */
  recordArrayAllocation(elements: number): void {
    this.tracker.recordAllocation(
      'array',
      Math.max(0, elements) * INT_SIZE_BYTES
    );
  }

  /** Record the release of the most recent auxiliary allocation. */
  recordArrayDeallocation(): void {
    this.tracker.recordDeallocation(this.tracker.getCurrentBytes());
  }

  getAllocationSummary(): AllocationSummary {
    const metrics: SpaceMetricsLike = this.tracker.getMetrics();
    return {
      allocations: metrics.measuredAllocations ?? 0,
      deallocations: metrics.measuredDeallocations ?? 0,
      peakBytes: this.tracker.getPeakBytes(),
      maxRecursionDepth: this.maxRecursionDepth,
    };
  }
}

type SpaceMetricsLike = {
  measuredAllocations?: number;
  measuredDeallocations?: number;
};

export type AllocationRecordType = AllocationRecord['type'];

export function sumMetrics(counter: OperationCounter): OperationMetrics {
  return counter.getMetrics();
}
