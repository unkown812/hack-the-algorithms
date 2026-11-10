import { describe, expect, it } from 'vitest';
import { ComparisonService } from '../../../src/core/complexity/comparison/ComparisonService';
import { AlgorithmComparator } from '../../../src/core/complexity/comparison/AlgorithmComparator';

const DATASET = [9, 4, 7, 1, 8, 3];

describe('AlgorithmComparator', () => {
  it('runs every algorithm on the identical dataset', async () => {
    const comparator = new AlgorithmComparator();

    const experiment = await comparator.compare({
      algorithmIds: ['bubble-sort', 'merge-sort'],
      input: { array: DATASET },
      scenario: 'random-order',
      trials: 2,
      warmupRuns: 1,
    });

    expect(experiment.sameInput).toBe(true);
    expect(experiment.dataset).toEqual(DATASET);
    expect(experiment.results).toHaveLength(2);
    for (const result of experiment.results) {
      expect(result.inputSize).toBe(DATASET.length);
      expect(result.outputValid).toBe(true);
    }
  });

  it('verifies that sorting algorithms produce equivalent outputs', async () => {
    const comparator = new AlgorithmComparator();

    const experiment = await comparator.compare({
      algorithmIds: ['bubble-sort', 'selection-sort', 'insertion-sort', 'merge-sort', 'quick-sort'],
      input: { array: DATASET },
      scenario: 'random-order',
      trials: 1,
      warmupRuns: 0,
    });

    expect(experiment.outputsEquivalent).toBe(true);
  });

  it('does not claim output equivalence across problem families', async () => {
    const comparator = new AlgorithmComparator();

    const experiment = await comparator.compare({
      algorithmIds: ['bubble-sort', 'binary-search'],
      input: { array: [1, 2, 3, 4, 5], target: 4 },
      scenario: 'random-order',
      trials: 1,
      warmupRuns: 0,
    });

    expect(experiment.outputsEquivalent).toBeUndefined();
  });

  it('requires at least one algorithm', async () => {
    const comparator = new AlgorithmComparator();

    await expect(
      comparator.compare({
        algorithmIds: [],
        input: { array: DATASET },
        scenario: 'random-order',
      })
    ).rejects.toThrow(/at least one algorithm/i);
  });
});

describe('ComparisonService', () => {
  it('builds a comparison table for algorithms of the same family', async () => {
    const service = new ComparisonService();

    const result = await service.runComparison({
      algorithmIds: ['bubble-sort', 'merge-sort'],
      input: { array: DATASET },
      scenario: 'random-order',
      trials: 2,
      warmupRuns: 1,
    });

    expect(result.sameInput).toBe(true);
    expect(result.outputsEquivalent).toBe(true);
    expect(result.inputSize).toBe(DATASET.length);
    expect(result.algorithms).toHaveLength(2);

    for (const entry of result.algorithms) {
      expect(entry.inputSize).toBe(DATASET.length);
      expect(entry.scenario).toBe('random-order');
      expect(entry.outputValid).toBe(true);
      expect(entry.operationMetrics.totalOperations).toBeGreaterThan(0);
      expect(entry.theoreticalWorst.length).toBeGreaterThan(0);
      expect(entry.auxiliarySpace.length).toBeGreaterThan(0);
    }
  });

  it('explains that cross-family comparisons are not directly comparable', () => {
    const service = new ComparisonService();

    const mixed = service.getComparabilityNote(['bubble-sort', 'binary-search']);
    expect(mixed).toMatch(/NOT directly comparable/i);

    const sorting = service.getComparabilityNote(['bubble-sort', 'merge-sort']);
    expect(sorting).toMatch(/identical copy/i);

    const searching = service.getComparabilityNote(['binary-search', 'linear-search']);
    expect(searching).toMatch(/same target/i);
  });

  it('lists the algorithms of a category', () => {
    const service = new ComparisonService();

    expect(service.getComparableAlgorithms('Sorting')).toContain('merge-sort');
    expect(service.getComparableAlgorithms('Searching')).toContain('binary-search');
  });

  it('rejects an empty selection', async () => {
    const service = new ComparisonService();

    await expect(
      service.runComparison({
        algorithmIds: [],
        input: { array: DATASET },
        scenario: 'random-order',
      })
    ).rejects.toThrow(/at least one algorithm/i);
  });
});
