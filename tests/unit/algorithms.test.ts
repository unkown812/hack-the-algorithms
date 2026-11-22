import { describe, it, expect } from 'vitest';
import {
  getAllAlgorithms,
  getAlgorithmById,
  getAlgorithmsByCategory,
  searchAlgorithms,
} from '../../src/core/algorithms';

describe('Algorithm Registry', () => {
  it('should return all algorithms', () => {
    const algorithms = getAllAlgorithms();
    expect(algorithms.length).toBeGreaterThan(0);
  });

  it('should find algorithm by id', () => {
    const algo = getAlgorithmById('binary-search');
    expect(algo).toBeDefined();
    expect(algo?.id).toBe('binary-search');
    expect(algo?.name).toBe('Binary Search');
  });

  it('should return undefined for unknown id', () => {
    const algo = getAlgorithmById('non-existent');
    expect(algo).toBeUndefined();
  });

  it('should filter algorithms by category', () => {
    const searching = getAlgorithmsByCategory('searching');
    expect(searching.length).toBeGreaterThan(0);
    expect(searching.every((a) => a.category === 'searching')).toBe(true);
  });

  it('should search algorithms by query', () => {
    const results = searchAlgorithms('binary');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((a) => a.id === 'binary-search')).toBe(true);
  });

  it('should return all algorithms for empty query', () => {
    const results = searchAlgorithms('');
    expect(results.length).toBe(getAllAlgorithms().length);
  });

  it('should have valid complexity data', () => {
    const algorithms = getAllAlgorithms();
    for (const algo of algorithms) {
      expect(algo.timeComplexity.best).toBeDefined();
      expect(algo.timeComplexity.average).toBeDefined();
      expect(algo.timeComplexity.worst).toBeDefined();
      expect(algo.spaceComplexity.auxiliary).toBeDefined();
    }
  });

  it('should have valid difficulty levels', () => {
    const algorithms = getAllAlgorithms();
    const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
    for (const algo of algorithms) {
      expect(validDifficulties).toContain(algo.difficulty);
    }
  });

  it('should have unique algorithm IDs', () => {
    const algorithms = getAllAlgorithms();
    const ids = algorithms.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
