import { getAlgorithmById } from '../../algorithms/registry';
import { getConventionFor, getAllConventions } from '../counters/engine/CountingConventions';
import type { OperationMetrics } from '../types/OperationMetrics';
import type { BenchmarkResult } from '../types/BenchmarkResult';

export interface ComplexityReport {
  algorithmId: string;
  algorithmName: string;
  category: string;
  problemDescription: string;
  algorithmApproach: string;
  pseudocode: string[];
  timeComplexity: {
    best: string;
    average: string;
    worst: string;
  };
  spaceComplexity: {
    auxiliary: string;
    total?: string;
  };
  bestCase: string;
  averageCase: string;
  worstCase: string;
  bestCaseAnalysis?: string;
  averageCaseAnalysis?: string;
  worstCaseAnalysis?: string;
  assumptions?: string[];
  methodology?: string;
  dataClassificationNotice: string;
  operationMetrics?: OperationMetrics;
  benchmarkResults?: BenchmarkResult;
  observations?: string;
  conclusion?: string;
  generatedAt: string;
}

const CLASSIFICATION_NOTICE =
  'Data classification used in this report:\n' +
  '- THEORETICAL — reviewed complexity metadata and mathematical derivations (not measurements).\n' +
  '- INSTRUMENTED — operation counts produced by executing the instrumented, deterministic implementation.\n' +
  '- ESTIMATED — model-based byte/stack approximations derived from the theoretical class.\n' +
  '- MEASURED — timings recorded during an actual benchmark execution in the runtime environment.\n' +
  'Values are never merged across these categories.';

export class ComplexityReportGenerator {
  generateReport(
    algorithmId: string,
    options: {
      operationMetrics?: OperationMetrics;
      benchmarkResults?: BenchmarkResult;
      inputSize?: number;
      scenario?: string;
      observations?: string;
      conclusion?: string;
    } = {}
  ): ComplexityReport | null {
    const algorithm = getAlgorithmById(algorithmId);
    if (!algorithm) {return null;}

    const dc = algorithm.detailedComplexity;

    const report: ComplexityReport = {
      algorithmId: algorithm.id,
      algorithmName: algorithm.name,
      category: algorithm.category,
      problemDescription: algorithm.problemStatement,
      algorithmApproach: algorithm.approach,
      pseudocode: algorithm.pseudocode,
      timeComplexity: algorithm.timeComplexity,
      spaceComplexity: algorithm.spaceComplexity,
      bestCase: algorithm.timeComplexity.best,
      averageCase: algorithm.timeComplexity.average,
      worstCase: algorithm.timeComplexity.worst,
      bestCaseAnalysis: dc?.best.derivation.explanation,
      averageCaseAnalysis: dc?.average.derivation.explanation,
      worstCaseAnalysis: dc?.worst.derivation.explanation,
      assumptions: dc?.average.derivation.assumptions ?? dc?.best.derivation.assumptions,
      methodology: this.getMethodology(),
      dataClassificationNotice: CLASSIFICATION_NOTICE,
      operationMetrics: options.operationMetrics,
      benchmarkResults: options.benchmarkResults,
      observations: options.observations,
      conclusion: options.conclusion ??
        `${algorithm.name} has time complexity ${algorithm.timeComplexity.best} (best), ${algorithm.timeComplexity.average} (average) and ${algorithm.timeComplexity.worst} (worst), and uses ${algorithm.spaceComplexity.auxiliary} auxiliary space. These are theoretical classes; instrumented counts and measured timings, when present, characterise only the specific inputs on which they were gathered.`,
      generatedAt: new Date().toISOString(),
    };

    if (!options.operationMetrics) {
      report.operationMetrics = undefined;
    }

    return report;
  }

  getMethodology(): string {
    return (
      'Theoretical values come from reviewed complexity metadata in the algorithm registry ' +
      '(registry.ts) and are accompanied by explicit derivations. Operation counts are produced ' +
      'by an instrumented implementation that mirrors the C code line-for-line; they are ' +
      'deterministic for a given input and are NOT estimated from Big-O. Benchmarks execute the ' +
      'instrumented implementation with warm-up runs followed by repeated timed trials on the ' +
      'identical dataset, summarised with minimum, median, mean, maximum and standard deviation. ' +
      'Timings describe the instrumented TypeScript execution on this machine, not native C ' +
      'compiler output. Comparisons between algorithms are only valid on the identical dataset ' +
      'and within the same session.'
    );
  }

  generateConventionReference(): string {
    const lines: string[] = [];
    lines.push('# Operation Counting Conventions');
    lines.push('');
    for (const convention of getAllConventions()) {
      lines.push(`## ${convention.algorithmId}`);
      lines.push(convention.summary);
      lines.push('');
      for (const detail of convention.details) {
        lines.push(`- ${detail}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  generateMarkdown(report: ComplexityReport): string {
    const algorithm = report.algorithmId ? getAlgorithmById(report.algorithmId) : undefined;
    const convention = getConventionFor(report.algorithmId);

    const lines: string[] = [];
    lines.push(`# ${report.algorithmName} — Complexity Analysis Report`);
    lines.push('');
    lines.push(`Generated: ${report.generatedAt} · Category: ${report.category}`);
    lines.push('');
    lines.push('## Data Classification');
    lines.push('');
    lines.push(CLASSIFICATION_NOTICE);
    lines.push('');
    lines.push('## Problem Description');
    lines.push('');
    lines.push(report.problemDescription);
    lines.push('');
    lines.push('## Algorithm Approach');
    lines.push('');
    lines.push(report.algorithmApproach);
    lines.push('');
    lines.push('## Pseudocode');
    lines.push('');
    lines.push('```');
    report.pseudocode.forEach((line) => lines.push(line));
    lines.push('```');
    lines.push('');
    lines.push('## Time and Space Complexity (THEORETICAL)');
    lines.push('');
    lines.push('| Case | Complexity |');
    lines.push('| --- | --- |');
    lines.push(`| Best Case | ${report.timeComplexity.best} |`);
    lines.push(`| Average Case | ${report.timeComplexity.average} |`);
    lines.push(`| Worst Case | ${report.timeComplexity.worst} |`);
    lines.push(`| Auxiliary Space | ${report.spaceComplexity.auxiliary} |`);
    if (report.spaceComplexity.total) {
      lines.push(`| Total Space | ${report.spaceComplexity.total} |`);
    }
    lines.push('');

    if (report.bestCaseAnalysis || report.worstCaseAnalysis || report.averageCaseAnalysis) {
      lines.push('## Case Analyses (THEORETICAL)');
      lines.push('');
      if (report.bestCaseAnalysis) {
        lines.push('### Best Case');
        lines.push('');
        lines.push(report.bestCaseAnalysis);
        lines.push('');
      }
      if (report.averageCaseAnalysis) {
        lines.push('### Average Case');
        lines.push('');
        lines.push(report.averageCaseAnalysis);
        if (report.assumptions?.length) {
          lines.push('');
          lines.push('Assumptions:');
          for (const assumption of report.assumptions) {
            lines.push(`- ${assumption}`);
          }
        }
        lines.push('');
      }
      if (report.worstCaseAnalysis) {
        lines.push('### Worst Case');
        lines.push('');
        lines.push(report.worstCaseAnalysis);
        lines.push('');
      }
    }

    if (report.operationMetrics) {
      lines.push(`## Operation Counting Results (INSTRUMENTED)${report.benchmarkResults ? ` — input size ${report.benchmarkResults.inputSize}, scenario “${report.benchmarkResults.scenario}”` : ''}`);
      lines.push('');
      const m = report.operationMetrics;
      lines.push(`- Total counted operations: ${m.totalOperations}`);
      lines.push(`- Comparisons: ${m.comparisons}`);
      lines.push(`- Swaps: ${m.swaps}`);
      lines.push(`- Assignments: ${m.assignments}`);
      lines.push(`- Array accesses (reads): ${m.arrayAccesses}`);
      lines.push(`- Array writes: ${m.arrayWrites}`);
      lines.push(`- Loop iterations: ${m.loopIterations}`);
      lines.push(`- Recursive calls: ${m.recursiveCalls}`);
      lines.push(`- Function calls: ${m.functionCalls}`);
      lines.push(`- Arithmetic operations: ${m.arithmeticOperations}`);
      lines.push(`- Allocations: ${m.allocations} · Deallocations: ${m.deallocations}`);
      if (convention) {
        lines.push('');
        lines.push('Counting convention:');
        for (const detail of convention.details) {
          lines.push(`- ${detail}`);
        }
      }
      lines.push('');
    }

    if (report.benchmarkResults) {
      const b = report.benchmarkResults;
      lines.push('## Benchmark Results (MEASURED)');
      lines.push('');
      lines.push(`- Input size: ${b.inputSize}`);
      lines.push(`- Scenario: ${b.scenario}`);
      lines.push(`- Trials: ${b.trials} (after ${b.warmupRuns} warm-up run(s))`);
      lines.push(`- Minimum: ${b.minimumTimeMs.toFixed(3)} ms · Median: ${b.medianTimeMs.toFixed(3)} ms · Mean: ${b.meanTimeMs.toFixed(3)} ms · Maximum: ${b.maximumTimeMs.toFixed(3)} ms`);
      if (b.standardDeviationMs !== undefined) {
        lines.push(`- Standard deviation: ${b.standardDeviationMs.toFixed(3)} ms`);
      }
      lines.push('Runtime: instrumented TypeScript implementation inside the extension renderer. NOT native C performance.');
      lines.push('');
    }

    if (report.methodology) {
      lines.push('## Methodology');
      lines.push('');
      lines.push(report.methodology);
      lines.push('');
    }

    if (algorithm && algorithm.detailedComplexity?.average.derivation.assumptions?.length && algorithm.detailedComplexity.average.derivation.explanation) {
      lines.push('## Average-Case Assumptions (THEORETICAL)');
      lines.push('');
      for (const assumption of algorithm.detailedComplexity.average.derivation.assumptions) {
        lines.push(`- ${assumption}`);
      }
      lines.push('');
    }

    if (report.observations) {
      lines.push('## Observations');
      lines.push('');
      lines.push(report.observations);
      lines.push('');
    }

    lines.push('## Conclusion');
    lines.push('');
    lines.push(report.conclusion ?? '');
    lines.push('');

    return lines.join('\n');
  }

  generateCSV(report: ComplexityReport): string {
    const escape = (value: string): string => `"${value.replace(/"/g, '""')}"`;
    const lines: string[] = [];
    lines.push('Metric,Value,Classification');
    lines.push(`Algorithm,${escape(report.algorithmName)},theoretical`);
    lines.push(`Category,${escape(report.category)},theoretical`);
    lines.push(`Best Case,${escape(report.timeComplexity.best)},theoretical`);
    lines.push(`Average Case,${escape(report.timeComplexity.average)},theoretical`);
    lines.push(`Worst Case,${escape(report.timeComplexity.worst)},theoretical`);
    lines.push(`Auxiliary Space,${escape(report.spaceComplexity.auxiliary)},theoretical`);
    if (report.spaceComplexity.total) {
      lines.push(`Total Space,${escape(report.spaceComplexity.total)},theoretical`);
    }
    if (report.operationMetrics) {
      const m = report.operationMetrics;
      lines.push(`Total Operations,${m.totalOperations},instrumented`);
      lines.push(`Comparisons,${m.comparisons},instrumented`);
      lines.push(`Swaps,${m.swaps},instrumented`);
      lines.push(`Assignments,${m.assignments},instrumented`);
      lines.push(`Array Accesses,${m.arrayAccesses},instrumented`);
      lines.push(`Array Writes,${m.arrayWrites},instrumented`);
      lines.push(`Loop Iterations,${m.loopIterations},instrumented`);
      lines.push(`Recursive Calls,${m.recursiveCalls},instrumented`);
      lines.push(`Function Calls,${m.functionCalls},instrumented`);
      lines.push(`Arithmetic Operations,${m.arithmeticOperations},instrumented`);
      lines.push(`Allocations,${m.allocations},instrumented`);
      lines.push(`Deallocations,${m.deallocations},instrumented`);
    }
    if (report.benchmarkResults) {
      const b = report.benchmarkResults;
      lines.push(`Benchmark Input Size,${b.inputSize},measured`);
      lines.push(`Benchmark Scenario,${escape(b.scenario)},measured`);
      lines.push(`Benchmark Trials,${b.trials},measured`);
      lines.push(`Warm-up Runs,${b.warmupRuns},measured`);
      lines.push(`Minimum Time (ms),${b.minimumTimeMs.toFixed(6)},measured`);
      lines.push(`Median Time (ms),${b.medianTimeMs.toFixed(6)},measured`);
      lines.push(`Mean Time (ms),${b.meanTimeMs.toFixed(6)},measured`);
      lines.push(`Maximum Time (ms),${b.maximumTimeMs.toFixed(6)},measured`);
      if (b.standardDeviationMs !== undefined) {
        lines.push(`Std Dev (ms),${b.standardDeviationMs.toFixed(6)},measured`);
      }
    }
    return lines.join('\n');
  }

  generateJSON(report: ComplexityReport): string {
    const structured = {
      ...report,
      dataLabels: {
        theoretical: ['timeComplexity', 'spaceComplexity', 'caseAnalyses'],
        instrumented: report.operationMetrics ? ['operationMetrics'] : [],
        estimated: [],
        measured: report.benchmarkResults ? ['benchmarkResults'] : [],
      },
      methodologyNotice:
        'Theoretical values are derived mathematically; instrumented counts were produced by executing the deterministic instrumented implementation; benchmark timings were measured in the runtime environment and do not represent native C performance.',
    };
    return JSON.stringify(structured, null, 2);
  }
}
