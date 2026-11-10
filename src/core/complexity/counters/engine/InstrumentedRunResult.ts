import type { OperationMetrics } from '../../types/OperationMetrics';
import type { AllocationSummary } from './CountingContext';

/**
 * Result of one deterministic, instrumented algorithm execution.
 * `output` for sorting algorithms is the sorted array; for searching
 * algorithms it is the untouched input array (the answer is `foundIndex`).
 */
export interface InstrumentedRunResult {
  algorithmId: string;
  inputSize: number;
  scenario: string | undefined;
  output: number[];
  /** Searching algorithms only: index of the target or -1 when absent. */
  foundIndex?: number;
  /**
   * True when the output was verified against the expected contract
   * (sorted non-decreasing for sorting, index in-range or -1 for searching).
   */
  outputValid: boolean;
  metrics: OperationMetrics;
  auxiliary: AllocationSummary | undefined;
}

export interface InstrumentedInput {
  array: number[];
  target?: number;
  scenario?: string;
}
