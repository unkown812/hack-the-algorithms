import { describe, expect, it } from 'vitest';
import {
  COMPLEXITY_CLASSES,
  compareComplexity,
  getComplexityClass,
  getDominantTerm,
  normalizeComplexityNotation,
} from '../../../src/core/complexity/analyzer/ComplexityNormalizer';
import { RecurrenceAnalyzer } from '../../../src/core/complexity/analyzer/RecurrenceAnalyzer';
import { ComplexityExplanationService } from '../../../src/core/complexity/explanations/ComplexityExplanationService';
import { SpaceAnalyzer } from '../../../src/core/complexity/space/SpaceAnalyzer';
import { runInstrumentedInput } from '../../../src/core/complexity/counters/engine';
import {
  NOTATION_EXPLANATIONS,
  SPACE_COMPLEXITY_TOPICS,
  TIME_COMPLEXITY_TOPICS,
} from '../../../src/core/complexity/learning/ComplexityTopics';

describe('ComplexityNormalizer', () => {
  it('normalises notation', () => {
    expect(normalizeComplexityNotation('O(N)')).toBe('O(n)');
    expect(normalizeComplexityNotation('o(n log n)')).toBe('O(n log n)');
    expect(normalizeComplexityNotation('not-notation')).toBe('not-notation');
  });

  it('orders complexity classes from fastest to slowest', () => {
    expect(compareComplexity('O(1)', 'O(n)')).toBeLessThan(0);
    expect(compareComplexity('O(n log n)', 'O(n)')).toBeGreaterThan(0);
    expect(compareComplexity('O(n)', 'O(n)')).toBe(0);
  });

  it('exposes growth rates for every class', () => {
    expect(COMPLEXITY_CLASSES.length).toBeGreaterThanOrEqual(8);
    expect(getComplexityClass('O(n)')?.growthRate(10)).toBe(10);
    expect(getComplexityClass('O(n²)')?.growthRate(10)).toBe(100);
    expect(getComplexityClass('O(nope)')).toBeUndefined();
  });

  it('detects the dominant term of a sum', () => {
    expect(getDominantTerm('O(n + n²)')).toBe('O(n²)');
    expect(getDominantTerm('O(1 + n)')).toBe('O(n)');
  });
});

describe('RecurrenceAnalyzer', () => {
  const analyzer = new RecurrenceAnalyzer();

  it('applies the master theorem to a divide-and-conquer recurrence', () => {
    const result = analyzer.analyze('T(n) = 2T(n/2) + O(1)');
    expect(result.complexity).toBe('O(n^1.00)');
    expect(result.explanation).toMatch(/Master Theorem/);
  });

  it('handles the n log n case', () => {
    const result = analyzer.analyze('T(n) = 2T(n/2) + O(n log n)');
    expect(result.complexity).toContain('log n');
  });

  it('reports an unknown result for unparsable input instead of guessing', () => {
    const result = analyzer.analyze('some recurrence');
    expect(result.complexity).toBe('O(?)');
    expect(result.explanation).toMatch(/Could not parse/);
  });
});

describe('ComplexityExplanationService', () => {
  const service = new ComplexityExplanationService();

  it('explains an algorithm with all sections', () => {
    const explanation = service.explain('bubble-sort');

    expect(explanation).not.toBeNull();
    const titles = explanation!.sections.map((s) => s.title);
    expect(titles).toContain('Time Complexity');
    expect(titles).toContain('Space Complexity');
    expect(titles).toContain('Best Case Analysis');
  });

  it('filters sections by name', () => {
    const explanation = service.explain('bubble-sort', 'Time Complexity');
    expect(explanation?.sections).toHaveLength(1);
    expect(explanation?.sections[0].title).toBe('Time Complexity');
  });

  it('returns null for unknown algorithms', () => {
    expect(service.explain('nope')).toBeNull();
  });

  it('interprets instrumented operation counts', () => {
    const run = runInstrumentedInput('bubble-sort', { array: [5, 3, 8, 2, 1] });
    const lines = service.interpretOperations('bubble-sort', run.metrics, run.inputSize);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toMatch(/comparisons/);
  });

  it('interprets benchmark statistics and states the runtime caveat', () => {
    const lines = service.interpretBenchmark('bubble-sort', {
      algorithmId: 'bubble-sort',
      inputSize: 5,
      scenario: 'random-order',
      trials: 3,
      warmupRuns: 1,
      minimumTimeMs: 0.1,
      medianTimeMs: 0.11,
      meanTimeMs: 0.12,
      maximumTimeMs: 0.14,
      standardDeviationMs: 0.01,
      timestamp: Date.now(),
      outputValid: true,
    });

    expect(lines.join(' ')).toMatch(/not native C compiler output/i);
  });
});

describe('SpaceAnalyzer', () => {
  const analyzer = new SpaceAnalyzer();

  it('combines theory with instrumented space data', () => {
    const run = runInstrumentedInput('merge-sort', { array: [5, 3, 8, 2, 1] });
    const analysis = analyzer.analyzeRun('merge-sort', run);

    expect(analysis.theoreticalAuxiliary).toBe('O(n)');
    expect(analysis.estimatedAuxiliaryBytes).toBeGreaterThan(0);
    expect(analysis.measuredAllocations).toBe(8);
    expect(analysis.measuredPeakBytes).toBe(20);
    expect(analysis.measuredRecursionDepth).toBe(4);
    expect(analysis.notes).toMatch(/instrumented execution/);
  });

  it('keeps estimates and measurements in separate fields', () => {
    const run = runInstrumentedInput('bubble-sort', { array: [5, 3, 8, 2, 1] });
    const analysis = analyzer.analyzeRun('bubble-sort', run);

    expect(analysis.theoreticalAuxiliary).toBe('O(1)');
    expect(analysis.measuredAllocations).toBe(0);
    expect(analysis.measuredPeakBytes).toBe(0);
  });

  it('falls back to a model estimate without a run', () => {
    const analysis = analyzer.analyze('bubble-sort', 100);
    expect(analysis.estimatedAuxiliaryBytes).toBeGreaterThan(0);
    expect(analysis.notes).toMatch(/not a measurement/i);
  });
});

describe('learning content', () => {
  it('ships the reviewed time complexity topics', () => {
    expect(TIME_COMPLEXITY_TOPICS.length).toBeGreaterThanOrEqual(12);
    for (const topic of TIME_COMPLEXITY_TOPICS) {
      expect(topic.id.length).toBeGreaterThan(0);
      expect(topic.title.length).toBeGreaterThan(0);
      expect(topic.summary.length).toBeGreaterThan(20);
      expect(topic.keyPoints.length).toBeGreaterThan(0);
    }
  });

  it('ships space complexity topics and a notation table', () => {
    expect(SPACE_COMPLEXITY_TOPICS.length).toBeGreaterThanOrEqual(5);
    expect(NOTATION_EXPLANATIONS.length).toBeGreaterThanOrEqual(5);
    for (const entry of NOTATION_EXPLANATIONS) {
      expect(entry.notation.length).toBeGreaterThan(0);
      expect(entry.meaning.length).toBeGreaterThan(0);
      expect(entry.example.length).toBeGreaterThan(0);
    }
  });

  it('uses unique topic ids', () => {
    const ids = [...TIME_COMPLEXITY_TOPICS, ...SPACE_COMPLEXITY_TOPICS].map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
