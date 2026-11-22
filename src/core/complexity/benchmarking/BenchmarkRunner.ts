import { getAlgorithmById } from '../../algorithms/registry';
import { runInstrumentedInput, validateInstrumentedInput } from '../counters/engine';
import type { InstrumentedInput } from '../counters/engine';
import { BenchmarkStatistics } from './BenchmarkStatistics';
import type { BenchmarkResult, OperationMetrics } from '../types';

/** Minimal cancellation contract compatible with `AbortSignal`. */
export interface CancellationSignal {
  aborted: boolean;
}

export interface BenchmarkRunOptions {
  algorithmId: string;
  input: InstrumentedInput;
  scenario: string;
  trials?: number;
  warmupRuns?: number;
  timeoutMs?: number;
  onProgress?: (progress: number) => void;
  signal?: CancellationSignal;
}

export class CancellationRequestedError extends Error {
  constructor() {
    super('Benchmark cancelled');
    this.name = 'CancellationRequestedError';
  }
}

export class BenchmarkTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Benchmark exceeded the ${timeoutMs} ms time limit`);
    this.name = 'BenchmarkTimeoutError';
  }
}

/**
 * Measures real execution time of the instrumented (educational) TypeScript
 * implementations. Timings describe the instrumented execution, NOT native C
 * performance; where native timing matters, a controlled local C toolchain is
 * required and is not assumed to be available.
 */
export class BenchmarkRunner {
  async run(options: BenchmarkRunOptions): Promise<BenchmarkResult> {
    const {
      algorithmId,
      input,
      scenario,
      trials = 5,
      warmupRuns = 2,
      timeoutMs = 30000,
      onProgress,
      signal,
    } = options;

    if (!getAlgorithmById(algorithmId)) {
      throw new Error(`Algorithm not found: ${algorithmId}`);
    }

    const validation = validateInstrumentedInput(input);
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Invalid benchmark input');
    }

    if (trials < 1) {
      throw new Error('Trials must be at least 1');
    }
    if (warmupRuns < 0) {
      throw new Error('Warm-up runs cannot be negative');
    }

    const inputSize = input.array.length;
    const startedAt = performance.now();
    const checkDeadline = (): void => {
      if (signal?.aborted) {
        throw new CancellationRequestedError();
      }
      if (performance.now() - startedAt > timeoutMs) {
        throw new BenchmarkTimeoutError(timeoutMs);
      }
    };

    // The instrumented implementations never mutate the input, so the same
    // dataset object is safely reused for every run (identical initial state).
    for (let i = 0; i < warmupRuns; i++) {
      checkDeadline();
      runInstrumentedInput(algorithmId, input);
      yieldToEventLoop();
    }

    const timings: number[] = [];
    let operationMetrics: OperationMetrics | undefined;
    let outputValid = true;

    for (let i = 0; i < trials; i++) {
      checkDeadline();

      const start = performance.now();
      const runResult = runInstrumentedInput(algorithmId, input);
      timings.push(performance.now() - start);

      if (!runResult.outputValid) {
        outputValid = false;
      }
      operationMetrics = runResult.metrics;

      onProgress?.(((i + 1) / trials) * 100);
      yieldToEventLoop();
    }

    const stats = BenchmarkStatistics.calculate(timings);

    return {
      algorithmId,
      inputSize,
      scenario,
      trials,
      warmupRuns,
      minimumTimeMs: stats.minimumTimeMs,
      medianTimeMs: stats.medianTimeMs,
      meanTimeMs: stats.meanTimeMs,
      maximumTimeMs: stats.maximumTimeMs,
      standardDeviationMs: stats.standardDeviationMs,
      operationMetrics,
      timestamp: Date.now(),
      outputValid,
    };
  }

  cancel(): void {
    // Kept for API compatibility; prefer passing a signal to run().
  }
}

/** Yield control so long benchmarks do not freeze the rendering surface. */
function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
