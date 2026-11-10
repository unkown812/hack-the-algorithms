import { describe, expect, it } from 'vitest';
import {
  BenchmarkRunner,
  BenchmarkTimeoutError,
  CancellationRequestedError,
} from '../../../src/core/complexity/benchmarking/BenchmarkRunner';
import { BenchmarkStatistics } from '../../../src/core/complexity/benchmarking/BenchmarkStatistics';
import {
  DEFAULT_BENCHMARK_CONFIG,
  INPUT_SIZE_PRESETS,
  MAX_INPUT_LIMITS,
} from '../../../src/core/complexity/benchmarking/BenchmarkConfig';

const ARRAY = [5, 3, 8, 2, 1, 9, 4, 7, 6, 1];

describe('BenchmarkRunner', () => {
  it('runs warm-up runs and repeated trials on the identical dataset', async () => {
    const runner = new BenchmarkRunner();
    const progress: number[] = [];

    const result = await runner.run({
      algorithmId: 'bubble-sort',
      input: { array: ARRAY },
      scenario: 'random-order',
      trials: 4,
      warmupRuns: 2,
      onProgress: (p) => progress.push(p),
    });

    expect(result.trials).toBe(4);
    expect(result.warmupRuns).toBe(2);
    expect(result.inputSize).toBe(ARRAY.length);
    expect(result.scenario).toBe('random-order');
    expect(result.minimumTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.maximumTimeMs).toBeGreaterThanOrEqual(result.minimumTimeMs);
    expect(result.meanTimeMs).toBeGreaterThanOrEqual(result.minimumTimeMs);
    expect(result.medianTimeMs).toBeGreaterThanOrEqual(result.minimumTimeMs);
    expect(result.standardDeviationMs).toBeGreaterThanOrEqual(0);
    expect(progress).toEqual([25, 50, 75, 100]);
  });

  it('reports instrumented operation counts next to the timings', async () => {
    const runner = new BenchmarkRunner();

    const result = await runner.run({
      algorithmId: 'insertion-sort',
      input: { array: ARRAY },
      scenario: 'random-order',
      trials: 2,
      warmupRuns: 1,
    });

    expect(result.operationMetrics).toBeDefined();
    expect(result.operationMetrics?.comparisons).toBeGreaterThan(0);
    expect(result.outputValid).toBe(true);
  });

  it('never mutates the dataset between trials', async () => {
    const runner = new BenchmarkRunner();
    const input = [...ARRAY];

    const result = await runner.run({
      algorithmId: 'merge-sort',
      input: { array: input },
      scenario: 'random-order',
      trials: 3,
      warmupRuns: 1,
    });

    expect(input).toEqual(ARRAY);
    expect(result.outputValid).toBe(true);
  });

  it('rejects unknown algorithms and invalid input', async () => {
    const runner = new BenchmarkRunner();

    await expect(
      runner.run({ algorithmId: 'nope', input: { array: [1] }, scenario: 'random-order' })
    ).rejects.toThrow(/not found/i);

    await expect(
      runner.run({ algorithmId: 'bubble-sort', input: { array: [] }, scenario: 'random-order' })
    ).rejects.toThrow(/at least one element/i);

    await expect(
      runner.run({ algorithmId: 'bubble-sort', input: { array: [1] }, scenario: 'random-order', trials: 0 })
    ).rejects.toThrow(/Trials must be at least 1/);

    await expect(
      runner.run({
        algorithmId: 'bubble-sort',
        input: { array: [1] },
        scenario: 'random-order',
        warmupRuns: -1,
      })
    ).rejects.toThrow(/Warm-up runs cannot be negative/);
  });

  it('stops when the run is cancelled', async () => {
    const runner = new BenchmarkRunner();
    const signal = { aborted: false };

    const promise = runner.run({
      algorithmId: 'bubble-sort',
      input: { array: ARRAY },
      scenario: 'random-order',
      trials: 50,
      warmupRuns: 0,
      signal,
      onProgress: () => {
        signal.aborted = true;
      },
    });

    await expect(promise).rejects.toBeInstanceOf(CancellationRequestedError);
  });

  it('aborts when the time limit is exceeded', async () => {
    const runner = new BenchmarkRunner();

    await expect(
      runner.run({
        algorithmId: 'bubble-sort',
        input: { array: ARRAY },
        scenario: 'random-order',
        trials: 5,
        warmupRuns: 0,
        timeoutMs: -1,
      })
    ).rejects.toBeInstanceOf(BenchmarkTimeoutError);
  });
});

describe('BenchmarkStatistics', () => {
  it('summarises a sample', () => {
    const stats = BenchmarkStatistics.calculate([4, 1, 3, 2]);

    expect(stats.minimumTimeMs).toBe(1);
    expect(stats.maximumTimeMs).toBe(4);
    expect(stats.meanTimeMs).toBe(2.5);
    expect(stats.medianTimeMs).toBe(2.5);
    expect(stats.standardDeviationMs).toBeCloseTo(Math.sqrt(1.25), 10);
  });

  it('handles an empty sample', () => {
    const stats = BenchmarkStatistics.calculate([]);

    expect(stats.minimumTimeMs).toBe(0);
    expect(stats.medianTimeMs).toBe(0);
    expect(stats.meanTimeMs).toBe(0);
    expect(stats.maximumTimeMs).toBe(0);
  });
});

describe('benchmark configuration', () => {
  it('exposes size presets and per-algorithm input limits', () => {
    expect(INPUT_SIZE_PRESETS.length).toBeGreaterThan(0);
    expect([...INPUT_SIZE_PRESETS].sort((a, b) => a - b)).toEqual(INPUT_SIZE_PRESETS);

    for (const id of ['bubble-sort', 'selection-sort', 'merge-sort', 'quick-sort', 'binary-search']) {
      expect(MAX_INPUT_LIMITS[id]).toBeGreaterThan(0);
    }
    // Quadratic algorithms must stay below the near-linear ones.
    expect(MAX_INPUT_LIMITS['bubble-sort']).toBeLessThan(MAX_INPUT_LIMITS['merge-sort']);
    expect(MAX_INPUT_LIMITS['selection-sort']).toBeLessThan(MAX_INPUT_LIMITS['quick-sort']);
  });

  it('keeps the default configuration consistent with the presets', () => {
    expect(DEFAULT_BENCHMARK_CONFIG.trials).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_BENCHMARK_CONFIG.warmupRuns).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_BENCHMARK_CONFIG.timeoutMs).toBeGreaterThan(0);
    expect(DEFAULT_BENCHMARK_CONFIG.maxInputSize).toBeGreaterThanOrEqual(
      Math.max(...INPUT_SIZE_PRESETS)
    );
  });
});
