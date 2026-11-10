import type { OperationMetrics } from './OperationMetrics';

export interface BenchmarkResult {
  algorithmId: string;
  inputSize: number;
  scenario: string;
  trials: number;
  warmupRuns: number;
  minimumTimeMs: number;
  medianTimeMs: number;
  meanTimeMs: number;
  maximumTimeMs: number;
  standardDeviationMs?: number;
  operationMetrics?: OperationMetrics;
  /** False when any measured trial failed the output-equivalence check. */
  outputValid?: boolean;
  timestamp: number;
}

export interface BenchmarkSummary {
  algorithmId: string;
  inputSize: number;
  scenario: string;
  trials: number;
  minimumTimeMs: number;
  medianTimeMs: number;
  meanTimeMs: number;
  maximumTimeMs: number;
  standardDeviationMs?: number;
  operationMetrics?: OperationMetrics;
}