import type { ComplexityMetadata } from '../types/ComplexityAnalysis';
import { getAlgorithmById } from '../../algorithms/registry';

export interface AnalysisResult {
  algorithmId: string;
  metadata: ComplexityMetadata | null;
  error?: string;
}

export class ComplexityAnalyzer {
  analyze(algorithmId: string): AnalysisResult {
    const algorithm = getAlgorithmById(algorithmId);
    if (!algorithm) {
      return { algorithmId, metadata: null, error: `Algorithm not found: ${algorithmId}` };
    }

    const metadata: ComplexityMetadata = {
      algorithmId,
      timeComplexity: algorithm.timeComplexity,
      spaceComplexity: algorithm.spaceComplexity,
    };

    return { algorithmId, metadata };
  }

  getBestCase(algorithmId: string): string | undefined {
    const algorithm = getAlgorithmById(algorithmId);
    return algorithm?.timeComplexity.best;
  }

  getAverageCase(algorithmId: string): string | undefined {
    const algorithm = getAlgorithmById(algorithmId);
    return algorithm?.timeComplexity.average;
  }

  getWorstCase(algorithmId: string): string | undefined {
    const algorithm = getAlgorithmById(algorithmId);
    return algorithm?.timeComplexity.worst;
  }

  getAuxiliarySpace(algorithmId: string): string | undefined {
    const algorithm = getAlgorithmById(algorithmId);
    return algorithm?.spaceComplexity.auxiliary;
  }

  getTotalSpace(algorithmId: string): string | undefined {
    const algorithm = getAlgorithmById(algorithmId);
    return algorithm?.spaceComplexity.total;
  }
}