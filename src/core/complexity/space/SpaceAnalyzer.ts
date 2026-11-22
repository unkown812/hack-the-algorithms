import { getAlgorithmById } from '../../algorithms/registry';
import { MemoryEstimator } from './MemoryEstimator';
import { AllocationTracker } from './AllocationTracker';
import { FIXED_AUXILIARY_BYTES } from '../counters/engine';
import type { InstrumentedRunResult } from '../counters/engine';
import type { SpaceAnalysis, SpaceMetrics } from '../types/SpaceMetrics';

export class SpaceAnalyzer {
  private estimator = new MemoryEstimator();
  private tracker = new AllocationTracker();

  analyze(algorithmId: string, inputSize: number): SpaceAnalysis {
    const algorithm = getAlgorithmById(algorithmId);
    if (!algorithm) {
      return {
        algorithmId,
        inputSize,
        theoreticalAuxiliary: 'O(?)',
        notes: 'Algorithm not found',
      };
    }

    const estimate = this.estimator.estimate(algorithmId, inputSize);

    return {
      algorithmId,
      inputSize,
      theoreticalAuxiliary: algorithm.spaceComplexity.auxiliary,
      theoreticalTotal: algorithm.spaceComplexity.total,
      estimatedAuxiliaryBytes: estimate.bytes,
      notes: `${estimate.description} This is a theoretical estimate, not a measurement.`,
    };
  }

  /**
   * Combines reviewed theory with data recorded by an instrumented run.
   * Estimated bytes are model based; allocation and recursion numbers are
   * produced by the instrumented execution and labelled as such in the UI.
   */
  analyzeRun(algorithmId: string, run: InstrumentedRunResult): SpaceAnalysis {
    const algorithm = getAlgorithmById(algorithmId);
    if (!algorithm) {
      return {
        algorithmId,
        inputSize: run.inputSize,
        theoreticalAuxiliary: 'O(?)',
        notes: 'Algorithm not found',
      };
    }

    const aux = run.auxiliary;
    const mergeSortTempsAtPeak = algorithmId === 'merge-sort' ? aux?.peakBytes ?? 0 : 0;
    const fixedAuxBytes = FIXED_AUXILIARY_BYTES[algorithmId] ?? 0;

    // Model estimate: fixed locals + dynamic allocations actually issued.
    const estimatedAuxiliaryBytes = fixedAuxBytes + mergeSortTempsAtPeak;

    const notes: string[] = [];
    if (algorithmId === 'merge-sort') {
      notes.push('The instrumented merge allocates two temp arrays per merge step; 4 bytes per C int element is assumed for the byte estimates.');
    } else {
      notes.push('This implementation allocates no auxiliary arrays; the byte estimate covers local scalar variables only (4 bytes per C int).');
    }
    notes.push('Theoretical values are derived from complexity metadata. Allocation counts, peak bytes and recursion depth come from the instrumented execution and are reported separately from estimates.');

    return {
      algorithmId,
      inputSize: run.inputSize,
      theoreticalAuxiliary: algorithm.spaceComplexity.auxiliary,
      theoreticalTotal: algorithm.spaceComplexity.total,
      estimatedAuxiliaryBytes,
      measuredAllocations: aux?.allocations,
      measuredDeallocations: aux?.deallocations,
      measuredStackDepth: aux?.maxRecursionDepth,
      measuredPeakBytes: aux?.peakBytes,
      measuredRecursionDepth: aux?.maxRecursionDepth,
      notes: notes.join(' '),
    };
  }

  getMetrics(): SpaceMetrics {
    return this.tracker.getMetrics();
  }

  reset(): void {
    this.tracker.reset();
  }
}
