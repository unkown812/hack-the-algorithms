import { describe, expect, it } from 'vitest';
import { InputGenerator } from '../../../src/core/complexity/input/InputGenerator';
import { InputSizeTester } from '../../../src/core/complexity/input/InputSizeTester';

describe('InputGenerator', () => {
  it('produces identical data for the same seed', () => {
    const a = new InputGenerator(42).generate({ size: 25, scenario: 'random-order' });
    const b = new InputGenerator(42).generate({ size: 25, scenario: 'random-order' });

    expect(a).toEqual(b);
    expect(a).toHaveLength(25);
  });

  it('produces different data for different seeds', () => {
    const a = new InputGenerator(1).generate({ size: 25, scenario: 'random-order' });
    const b = new InputGenerator(2).generate({ size: 25, scenario: 'random-order' });

    expect(a).not.toEqual(b);
  });

  it('honours the requested value range', () => {
    const values = new InputGenerator(7).generate({
      size: 100,
      scenario: 'random-order',
      valueRange: [10, 20],
    });

    expect(values).toHaveLength(100);
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  it('builds the documented scenario shapes', () => {
    const generator = new InputGenerator(3);

    const sorted = generator.generate({ size: 10, scenario: 'already-sorted' });
    expect([...sorted].sort((a, b) => a - b)).toEqual(sorted);

    const reversed = generator.generate({ size: 10, scenario: 'reverse-sorted' });
    expect([...reversed].sort((a, b) => b - a)).toEqual(reversed);

    const duplicates = generator.generate({ size: 20, scenario: 'duplicate-heavy' });
    expect(new Set(duplicates).size).toBeLessThan(20);

    expect(generator.generate({ size: 0, scenario: 'random-order' })).toEqual([]);
  });

  it('exposes a seeded range helper', () => {
    const generator = new InputGenerator(11);
    const values = Array.from({ length: 50 }, () => generator.range(1, 5));

    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(5);
    }
    expect(new Set(values).size).toBeLessThanOrEqual(5);
  });
});

describe('InputSizeTester', () => {
  it('is deterministic when a seed is supplied', () => {
    const tester = new InputSizeTester();
    const first = tester.generateDataset('bubble-sort', 20, 'random-order', { seed: 99 });
    const second = tester.generateDataset('bubble-sort', 20, 'random-order', { seed: 99 });

    expect(second.array).toEqual(first.array);
    expect(second.size).toBe(20);
  });

  it('honours the value range for sorting datasets', () => {
    const tester = new InputSizeTester();
    const dataset = tester.generateDataset('quick-sort', 30, 'random-order', {
      seed: 5,
      valueRange: [100, 200],
    });

    expect(dataset.array).toHaveLength(30);
    for (const value of dataset.array) {
      expect(value).toBeGreaterThanOrEqual(100);
      expect(value).toBeLessThanOrEqual(200);
    }
  });

  it('creates sorted arrays with a reachable target for search algorithms', () => {
    const tester = new InputSizeTester();

    for (const scenario of [
      'target-beginning',
      'target-middle',
      'target-end',
      'random-target',
    ] as const) {
      const dataset = tester.generateDataset('binary-search', 16, scenario, { seed: 21 });

      expect(dataset.array).toHaveLength(16);
      expect([...dataset.array].sort((a, b) => a - b)).toEqual(dataset.array);
      expect(dataset.target).toBeDefined();
      if (scenario !== 'random-target') {
        expect(dataset.array).toContain(dataset.target);
      }
    }
  });

  it('creates an unreachable target for the not-found scenario', () => {
    const tester = new InputSizeTester();
    const dataset = tester.generateDataset('linear-search', 10, 'target-not-found', { seed: 8 });

    expect(dataset.target).toBeDefined();
    expect(dataset.array).not.toContain(dataset.target);
  });

  it('generates multiple sizes', () => {
    const tester = new InputSizeTester();
    const datasets = tester.generateMultiple('bubble-sort', [5, 10, 15], 'random-order', {
      seed: 1,
    });

    expect(datasets.map((d) => d.size)).toEqual([5, 10, 15]);
    expect(datasets.every((d) => d.array.length === d.size)).toBe(true);
  });

  it('lists the scenarios that apply to each family', () => {
    const tester = new InputSizeTester();

    expect(tester.getSupportedScenarios('bubble-sort')).toContain('random-order');
    expect(tester.getSupportedScenarios('binary-search')).toContain('target-middle');
    expect(tester.getSupportedScenarios('binary-search')).not.toContain('random-order');
  });
});
