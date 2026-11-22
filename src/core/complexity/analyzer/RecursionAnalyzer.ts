export interface RecursionAnalysis {
  depth: number;
  calls: number;
  stackSpace: string;
  explanation: string;
}

export class RecursionAnalyzer {
  analyze(
    baseCaseSize: number,
    subproblemReduction: number,
    subproblemsPerCall: number,
    inputSize: number
  ): RecursionAnalysis {
    const depth = Math.max(0, Math.ceil(Math.log(subproblemReduction) / Math.log(inputSize / Math.max(1, baseCaseSize))));
    const calls = Math.pow(subproblemsPerCall, depth);
    const stackSpace = depth <= 1 ? 'O(1)' : `O(${this.getComplexityFromDepth(depth)})`;

    return {
      depth,
      calls,
      stackSpace,
      explanation: `Recursion tree has depth ${depth} with ${subproblemsPerCall} subproblems per call, totaling approximately ${calls} calls. Stack space is proportional to depth.`,
    };
  }

  private getComplexityFromDepth(depth: number): string {
    if (depth <= 1) {return '1';}
    if (depth <= 5) {return 'log n';}
    return 'n';
  }
}