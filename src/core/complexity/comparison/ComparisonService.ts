import { AlgorithmComparator } from './AlgorithmComparator';
import { getAlgorithmById, getAllAlgorithms } from '../../algorithms/registry';
import { runInstrumentedInput, SEARCHING_CATEGORY, SORTING_CATEGORY } from '../counters/engine';
import type { InstrumentedInput } from '../counters/engine';
import type { ComparisonResult, AlgorithmComparisonEntry } from '../types/ComparisonResult';
import type { OperationMetrics } from '../types/OperationMetrics';
import { createOperationMetrics } from '../types/OperationMetrics';

export interface ComparisonConfig {
  algorithmIds: string[];
  input: InstrumentedInput;
  scenario: string;
  trials?: number;
  warmupRuns?: number;
}

export class ComparisonService {
  private comparator = new AlgorithmComparator();

  async runComparison(config: ComparisonConfig): Promise<ComparisonResult> {
    const { algorithmIds, input, scenario, trials = 5, warmupRuns = 2 } = config;

    if (algorithmIds.length === 0) {
      throw new Error('Select at least one algorithm to compare.');
    }

    const experiment = await this.comparator.compare({
      algorithmIds,
      input,
      scenario,
      trials,
      warmupRuns,
    });

    const entries: AlgorithmComparisonEntry[] = experiment.results.map((r) => {
      const algorithm = getAlgorithmById(r.algorithmId);
      // Reference run to attach deterministic metrics to the table row
      // (benchmark timings stay separate from instrumented counts).
      const reference = runInstrumentedInput(r.algorithmId, input);
      return {
        algorithmId: r.algorithmId,
        algorithmName: algorithm?.name ?? r.algorithmId,
        theoreticalBest: algorithm?.timeComplexity.best ?? '?',
        theoreticalAverage: algorithm?.timeComplexity.average ?? '?',
        theoreticalWorst: algorithm?.timeComplexity.worst ?? '?',
        auxiliarySpace: algorithm?.spaceComplexity.auxiliary ?? '?',
        operationMetrics: reference.metrics ?? createOperationMetrics(),
        executionTimeMs: r.meanTimeMs,
        inputSize: r.inputSize,
        scenario: r.scenario,
        outputValid: r.outputValid ?? reference.outputValid,
      };
    });

    return {
      algorithms: entries,
      inputSize: experiment.results[0]?.inputSize ?? 0,
      scenario,
      timestamp: experiment.timestamp,
      sameInput: experiment.sameInput,
      outputsEquivalent: experiment.outputsEquivalent,
    };
  }

  getComparableAlgorithms(category: string): string[] {
    const normalized = category.trim().toLowerCase();
    return getAllAlgorithms()
      .filter((a) => a.category.toLowerCase() === normalized)
      .map((a) => a.id);
  }

  /**
   * Explains comparison validity for an algorithm family. BFS vs DFS style
   * cross-problem comparisons must not be presented as interchangeable.
   */
  getComparabilityNote(algorithmIds: string[]): string {
    const categories = new Set(
      algorithmIds
        .map((id) => getAlgorithmById(id)?.category.toLowerCase())
        .filter((c): c is string => Boolean(c))
    );
    if (categories.size > 1) {
      return 'These algorithms solve different problems (different categories). Output correctness and operation counts are shown per algorithm, but they are NOT directly comparable against each other.';
    }
    if (categories.has(SORTING_CATEGORY)) {
      return 'All selected algorithms sort the same number array. Every run re-sorts an identical copy of the dataset and the resulting output arrays are verified to be equivalent before results are shown.';
    }
    if (categories.has(SEARCHING_CATEGORY)) {
      return 'All selected algorithms search for the same target in the same array. Reported comparison counts are directly comparable; execution time differences mainly reflect the number of visited elements.';
    }
    return 'Comparison validity is uncertain for this category; verify the problem contract before interpreting results.';
  }

  emptyMetrics(): OperationMetrics {
    return createOperationMetrics();
  }
}
