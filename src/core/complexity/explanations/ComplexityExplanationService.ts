import { getAlgorithmById } from '../../algorithms/registry';

export interface ExplanationSection {
  title: string;
  content: string;
}

export interface ComplexityExplanation {
  algorithmId: string;
  sections: ExplanationSection[];
}

export class ComplexityExplanationService {
  explain(algorithmId: string, section?: string): ComplexityExplanation | null {
    const algorithm = getAlgorithmById(algorithmId);
    if (!algorithm) {return null;}

    const sections: ExplanationSection[] = [];

    sections.push({
      title: 'Algorithm Overview',
      content: `${algorithm.name}: ${algorithm.description}`,
    });

    sections.push({
      title: 'Time Complexity',
      content: `Best: ${algorithm.timeComplexity.best}, Average: ${algorithm.timeComplexity.average}, Worst: ${algorithm.timeComplexity.worst}`,
    });

    sections.push({
      title: 'Space Complexity',
      content: `Auxiliary: ${algorithm.spaceComplexity.auxiliary}${algorithm.spaceComplexity.total ? `, Total: ${algorithm.spaceComplexity.total}` : ''}`,
    });

    if (algorithm.detailedComplexity) {
      const dc = algorithm.detailedComplexity;

      sections.push({
        title: 'Best Case Analysis',
        content: dc.best.explanation,
      });

      sections.push({
        title: 'Average Case Analysis',
        content: dc.average.explanation,
      });

      sections.push({
        title: 'Worst Case Analysis',
        content: dc.worst.explanation,
      });

      sections.push({
        title: 'Space Analysis',
        content: dc.space.auxiliary.explanation,
      });

      if (dc.space.total) {
        sections.push({
          title: 'Total Space Analysis',
          content: dc.space.total.explanation,
        });
      }
    }

    if (section) {
      return {
        algorithmId,
        sections: sections.filter((s) =>
          s.title.toLowerCase().includes(section.toLowerCase())
        ),
      };
    }

    return { algorithmId, sections };
  }

  explainComplexity(algorithmId: string, complexityType: 'best' | 'average' | 'worst' | 'space'): string {
    const algorithm = getAlgorithmById(algorithmId);
    if (!algorithm) {return 'Algorithm not found.';}

    if (complexityType === 'space') {
      return algorithm.spaceComplexity.auxiliary;
    }

    return algorithm.timeComplexity[complexityType];
  }

  /**
   * Connects an instrumented operation-count run to the theoretical model.
   * Returns plain-language observation lines for the results panel.
   */
  interpretOperations(
    algorithmId: string,
    metrics: import('../types/OperationMetrics').OperationMetrics,
    inputSize: number
  ): string[] {
    const algorithm = getAlgorithmById(algorithmId);
    if (!algorithm) {
      return ['Algorithm not found.'];
    }

    const observations: string[] = [];
    const n = Math.max(1, inputSize);
    const worstClass = this.parseGrowthClass(algorithm.timeComplexity.worst);
    const comparisons = metrics.comparisons;
    const bestClass = this.parseGrowthClass(algorithm.timeComplexity.best);

    switch (algorithmId) {
    case 'bubble-sort': {
      if (comparisons <= n - 1) {
        observations.push(`Only ${comparisons} comparisons were needed and early termination stopped after the first pass — consistent with the O(1)-pass best case behaviour of the flag-based implementation.`);
      } else {
        observations.push(`With ${comparisons} comparisons at n = ${n}, the run used about ${(comparisons / (n * n)).toFixed(2)}·n² comparisons — quadratic growth, consistent with the ${algorithm.timeComplexity.worst} worst case.`);
      }
      observations.push(`Every swap performed 2 array writes and 1 scalar temp assignment, so ${metrics.swaps} swaps produced ${metrics.arrayWrites} writes.`);
      break;
    }
    case 'selection-sort': {
      observations.push(`Selection sort always scans the full unsorted suffix: ${comparisons} comparisons at n = ${n} matches the invariant (n-1)(n)/2-ish comparison count, independent of input order — its best and worst case share the same ${algorithm.timeComplexity.best} comparison count.`);
      observations.push(`${metrics.swaps} swaps means ${metrics.swaps} positions were corrected with one exchange each.`);
      break;
    }
    case 'insertion-sort': {
      if (comparisons <= n - 1) {
        observations.push(`Each element compared only against its predecessor (${comparisons} comparisons total at n = ${n}) — the signature O(n) best case of insertion sort on sorted input.`);
      } else {
        observations.push(`Insertion sort performed ${comparisons} element comparisons in ${metrics.loopIterations} shift steps at n = ${n}; quadratic behaviour in line with its ${algorithm.timeComplexity.worst} worst case.`);
      }
      break;
    }
    case 'merge-sort': {
      observations.push(`Merge sort made ${metrics.recursiveCalls} mergeSort invocations (2n - 1 = ${2 * n - 1} tree nodes at n = ${n}) and ${metrics.functionCalls} merge calls (n - 1 = ${n - 1} internal nodes).`);
      observations.push(`Comparisons grew with n·log(n) ≈ ${(n * Math.log2(Math.max(2, n))).toFixed(0)} while the measured count was ${metrics.comparisons} — the log factor comes from the log₂(n) merge levels.`);
      observations.push(`${metrics.allocations} temp-array allocations (${metrics.deallocations} releases) explain why auxiliary space is Θ(n).`);
      break;
    }
    case 'quick-sort': {
      observations.push(`Partitioning placed ${metrics.swaps} elements via exchanges; ${metrics.functionCalls} partition calls split the array ${metrics.functionCalls} times.`);
      if (metrics.loopIterations <= n) {
        observations.push('The unusually small partition work indicates a degenerate recursion (pivot extremes) — the known O(n²) pitfall of last-element pivots, visible in already-sorted inputs.');
      } else {
        observations.push(`Partition scan work (${metrics.loopIterations} loop iterations) is the dominant cost; the theoretical ${algorithm.timeComplexity.worst} worst case is reached when pivots are always extreme.`);
      }
      break;
    }
    case 'linear-search': {
      if (metrics.comparisons === 1) {
        observations.push('The target was found at the first position — the O(1) best case. One comparison, one array read.');
      } else {
        observations.push(`${metrics.comparisons} comparisons equals the number of examined positions (index ${metrics.comparisons - 1} if found); worst case examines all n = ${n} elements → O(n).`);
      }
      break;
    }
    case 'binary-search': {
      if (metrics.loopIterations > 0) {
        observations.push(`Binary search probed ${metrics.loopIterations} times at n = ${n}, matching the theoretical ⌈log₂(n)⌉ = ${Math.ceil(Math.log2(Math.max(1, n))) + 1} bound for the O(log n) class.`);
        observations.push('Every failed probe costs 2 comparisons (== then <); a successful final probe costs 1.');
      } else {
        observations.push('Every value in the dataset was eliminated without finding the target — the loop ran once per level: O(log n) comparisons, O(log n) probes.');
      }
      break;
    }
    default:
      break;
    }

    observations.push(`Best case ${algorithm.timeComplexity.best} describes a different input family than this run; theoretical classes observed: worst ${worstClass ?? '?'}, best ${bestClass ?? '?'}.`);
    return observations;
  }

  /** Short interpretation for benchmark statistics (instrumented timing). */
  interpretBenchmark(
    algorithmId: string,
    result: import('../types/BenchmarkResult').BenchmarkResult
  ): string[] {
    const algorithm = getAlgorithmById(algorithmId);
    const lines: string[] = [];
    if (algorithm) {
      lines.push(`Theoretical expectation for this algorithm is ${algorithm.timeComplexity.average} on average (${algorithm.timeComplexity.worst} worst); timings are reported, never implied, by the theory.`);
    }
    lines.push(`${result.trials} measured trials after ${result.warmupRuns} warm-up run(s); median ${result.medianTimeMs.toFixed(3)} ms vs mean ${result.meanTimeMs.toFixed(3)} ms. When the mean is clearly above the median, a few slow outliers dominate the mean.`);
    if (result.standardDeviationMs !== undefined) {
      const cv = result.meanTimeMs > 0 ? result.standardDeviationMs / result.meanTimeMs : 0;
      lines.push(`Standard deviation ${result.standardDeviationMs.toFixed(3)} ms gives a coefficient of variation of about ${(cv * 100).toFixed(0)}% — ${cv > 0.25 ? 'high; rerun the benchmark when the machine is idle' : 'reasonably stable for a shared machine'}.`);
    }
    lines.push('CAUTION: measurement reflects the instrumented TypeScript execution environment (renderer process; hardware, JIT state and load influence it), not native C compiler output. Compare algorithms only against benchmarks run on the same dataset and the same session.');
    return lines;
  }

  private parseGrowthClass(notation: string): string | undefined {
    const normalized = this.normalize(notation);
    const classes = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)', 'O(n!)'];
    const found = classes.find((c) => normalized === c);
    return found;
  }

  private normalize(notation: string): string {
    return notation.trim().replace(/^O\((.+)\)$/i, 'O($1)').toLowerCase().replace(/\s+/g, ' ')
      .replace(/\*\*/g, '^') // tolerate caret/power notation
      .replace(/n\^2/g, 'n²')
      .replace(/n\^3/g, 'n³')
      .replace(/n\^log/g, 'n^log');
  }
}