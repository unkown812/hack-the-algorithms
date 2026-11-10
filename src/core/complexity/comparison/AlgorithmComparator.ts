import { BenchmarkRunner } from '../benchmarking/BenchmarkRunner';
import { runInstrumentedInput, isSortingAlgorithm } from '../counters/engine';
import type { InstrumentedInput } from '../counters/engine';
import type { BenchmarkResult } from '../types/BenchmarkResult';

export interface ComparisonExperiment {
  algorithmIds: string[];
  input: InstrumentedInput;
  scenario: string;
  trials?: number;
  warmupRuns?: number;
  config?: { timeoutMs?: number };
}

export interface ComparisonExperimentResult {
  results: BenchmarkResult[];
  /** True: every algorithm measured the identical dataset (deep-copied per trial). */
  sameInput: boolean;
  /**
   * True only when outputs are equivalent AND each algorithm's output was
   * valid for its problem contract. Undefined when the algorithms solve
   * different problems (e.g. searching algorithms report indices, sorts
   * return arrays are not directly output-comparable).
   */
  outputsEquivalent?: boolean;
  dataset: number[];
  timestamp: number;
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {return false;}
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {return false;}
  }
  return true;
}

/**
 * Runs every algorithm on the same dataset and validates the outputs.
 * Only algorithms from the same problem family should be compared; see
 * `ComparisonService.getComparabilityNote`.
 */
export class AlgorithmComparator {
  private runner = new BenchmarkRunner();

  async compare(experiment: ComparisonExperiment): Promise<ComparisonExperimentResult> {
    const { algorithmIds, input, scenario, trials = 5, warmupRuns = 2 } = experiment;

    if (algorithmIds.length === 0) {
      throw new Error('Select at least one algorithm to compare.');
    }
    if (algorithmIds.length < 1) {
      throw new Error('At least one algorithm is required.');
    }

    // Mixed sorting/searching runs do not have a common output contract.
    const allSorting = algorithmIds.every((id) => isSortingAlgorithm(id));

    const results: BenchmarkResult[] = [];
    for (const algorithmId of algorithmIds) {
      const result = await this.runner.run({
        algorithmId,
        input,
        scenario,
        trials,
        warmupRuns,
        timeoutMs: experiment.config?.timeoutMs,
      });
      results.push(result);
    }

    let outputsEquivalent: boolean | undefined;
    if (allSorting) {
      const outputs: number[][] = algorithmIds.map((algorithmId) =>
        runInstrumentedInput(algorithmId, input).output
      );
      outputsEquivalent = outputs.every((o) => arraysEqual(o, outputs[0]));
    }

    return {
      results,
      sameInput: true,
      outputsEquivalent,
      dataset: [...input.array],
      timestamp: Date.now(),
    };
  }

  formatComparison(results: BenchmarkResult[]): string {
    const lines: string[] = [];
    lines.push('Algorithm Comparison Results');
    lines.push('============================');
    lines.push('');

    for (const r of results) {
      lines.push(`Algorithm: ${r.algorithmId}`);
      lines.push(`  Input Size: ${r.inputSize}`);
      lines.push(`  Scenario: ${r.scenario}`);
      lines.push(`  Mean Time: ${r.meanTimeMs.toFixed(3)} ms`);
      lines.push(`  Median Time: ${r.medianTimeMs.toFixed(3)} ms`);
      lines.push(`  Min Time: ${r.minimumTimeMs.toFixed(3)} ms`);
      lines.push(`  Max Time: ${r.maximumTimeMs.toFixed(3)} ms`);
      if (r.standardDeviationMs !== undefined) {
        lines.push(`  Std Dev: ${r.standardDeviationMs.toFixed(3)} ms`);
      }
      if (r.operationMetrics) {
        lines.push(`  Operations: ${r.operationMetrics.totalOperations}`);
        lines.push(`  Comparisons: ${r.operationMetrics.comparisons}`);
        lines.push(`  Swaps: ${r.operationMetrics.swaps}`);
      }
      if (r.outputValid === false) {
        lines.push('  WARNING: some trials produced an invalid output!');
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
