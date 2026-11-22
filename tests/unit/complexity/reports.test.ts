import { describe, expect, it } from 'vitest';
import { ComplexityReportGenerator } from '../../../src/core/complexity/reports/ComplexityReportGenerator';
import { ReportExporter } from '../../../src/core/complexity/reports/ReportExporter';
import { runInstrumentedInput } from '../../../src/core/complexity/counters/engine';

const generator = new ComplexityReportGenerator();

const report = generator.generateReport('bubble-sort', {
  operationMetrics: runInstrumentedInput('bubble-sort', { array: [5, 3, 8, 2, 1] }).metrics,
  observations: 'Observed on a five element unsorted array.',
})!;

describe('ComplexityReportGenerator', () => {
  it('returns null for unknown algorithms', () => {
    expect(generator.generateReport('not-an-algorithm')).toBeNull();
  });

  it('collects the theoretical metadata of the algorithm', () => {
    expect(report.algorithmId).toBe('bubble-sort');
    expect(report.algorithmName.length).toBeGreaterThan(0);
    expect(report.timeComplexity.best).toBeTruthy();
    expect(report.spaceComplexity.auxiliary).toBeTruthy();
    expect(report.pseudocode.length).toBeGreaterThan(0);
    expect(report.bestCaseAnalysis?.length ?? 0).toBeGreaterThan(10);
    expect(report.methodology?.length ?? 0).toBeGreaterThan(50);
  });

  it('labels the data classes explicitly', () => {
    expect(report.dataClassificationNotice).toMatch(/THEORETICAL/);
    expect(report.dataClassificationNotice).toMatch(/INSTRUMENTED/);
    expect(report.dataClassificationNotice).toMatch(/ESTIMATED/);
    expect(report.dataClassificationNotice).toMatch(/MEASURED/);
  });

  it('renders markdown with methodology, classification and counted operations', () => {
    const markdown = generator.generateMarkdown(report);

    expect(markdown).toContain('# Bubble Sort');
    expect(markdown).toContain('## Data Classification');
    expect(markdown).toContain('## Methodology');
    expect(markdown).toContain('Operation Counting Results (INSTRUMENTED)');
    expect(markdown).toContain('Counting convention:');
    expect(markdown).toContain('- Comparisons:');
    // No benchmark was supplied, so no measured section may be claimed.
    expect(markdown).not.toContain('Benchmark Results (MEASURED)');
  });

  it('separates measured benchmark results from instrumented counts', () => {
    const withBenchmark = generator.generateReport('bubble-sort', {
      operationMetrics: runInstrumentedInput('bubble-sort', { array: [5, 3, 8, 2, 1] }).metrics,
      benchmarkResults: {
        algorithmId: 'bubble-sort',
        inputSize: 5,
        scenario: 'random-order',
        trials: 3,
        warmupRuns: 1,
        minimumTimeMs: 0.1,
        medianTimeMs: 0.12,
        meanTimeMs: 0.13,
        maximumTimeMs: 0.15,
        standardDeviationMs: 0.02,
        timestamp: Date.now(),
        outputValid: true,
      },
    })!;

    const markdown = generator.generateMarkdown(withBenchmark);
    expect(markdown).toContain('## Benchmark Results (MEASURED)');
    expect(markdown).toContain('NOT native C performance');

    const csv = generator.generateCSV(withBenchmark);
    expect(csv).toMatch(/Benchmark Trials,3,measured/);
    expect(csv).toMatch(/Comparisons,\d+,instrumented/);
  });

  it('renders csv rows with a classification column', () => {
    const csv = generator.generateCSV(report);
    const lines = csv.split('\n');

    expect(lines[0]).toBe('Metric,Value,Classification');
    expect(csv).toMatch(/Best Case,"[^"]+",theoretical/);
    expect(csv).toMatch(/Comparisons,\d+,instrumented/);
    expect(csv).not.toMatch(/Comparisons,\d+,measured/);
  });

  it('renders json with the structured data labels', () => {
    const json = generator.generateJSON(report);
    const parsed = JSON.parse(json);

    expect(parsed.algorithmId).toBe('bubble-sort');
    expect(parsed.dataLabels.theoretical).toContain('timeComplexity');
    expect(parsed.dataLabels.instrumented).toContain('operationMetrics');
    expect(parsed.dataLabels.measured).toEqual([]);
    expect(parsed.methodologyNotice).toMatch(/not represent native C performance/i);
  });

  it('documents the counting conventions of every algorithm', () => {
    const reference = generator.generateConventionReference();

    expect(reference).toContain('# Operation Counting Conventions');
    expect(reference).toContain('## bubble-sort');
    expect(reference).toContain('## merge-sort');
    expect(reference).toContain('## binary-search');
  });
});

describe('ReportExporter', () => {
  const exporter = new ReportExporter();

  it('exports the requested format', () => {
    expect(exporter.export(report, 'markdown')).toContain('# Bubble Sort');
    expect(exporter.export(report, 'csv')).toContain('Metric,Value,Classification');
    expect(JSON.parse(exporter.export(report, 'json')).algorithmId).toBe('bubble-sort');
  });

  it('builds a payload with the right file name and language', () => {
    const markdown = exporter.buildPayload(report, 'markdown', 'report.md');
    expect(markdown.fileName).toBe('report.md');
    expect(markdown.languageId).toBe('markdown');
    expect(markdown.content.length).toBeGreaterThan(0);

    const csv = exporter.buildPayload(report, 'csv');
    expect(csv.fileName.endsWith('.csv')).toBe(true);
    expect(csv.languageId).toBe('csv');
  });

  it('rejects unsupported formats', () => {
    expect(() => exporter.export(report, 'pdf' as never)).toThrow(/Unsupported format/);
  });
});
