import type { BenchmarkResult } from '../types/BenchmarkResult';

export class BenchmarkStatistics {
  static calculate(values: number[]): Omit<BenchmarkResult, 'algorithmId' | 'inputSize' | 'scenario' | 'trials' | 'warmupRuns' | 'timestamp'> {
    if (values.length === 0) {
      return {
        minimumTimeMs: 0,
        medianTimeMs: 0,
        meanTimeMs: 0,
        maximumTimeMs: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const minimumTimeMs = sorted[0];
    const maximumTimeMs = sorted[sorted.length - 1];
    const meanTimeMs = values.reduce((sum, v) => sum + v, 0) / values.length;

    const mid = Math.floor(sorted.length / 2);
    const medianTimeMs =
      sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - meanTimeMs, 2), 0) /
      values.length;
    const standardDeviationMs = Math.sqrt(variance);

    return {
      minimumTimeMs,
      medianTimeMs,
      meanTimeMs,
      maximumTimeMs,
      standardDeviationMs,
    };
  }
}