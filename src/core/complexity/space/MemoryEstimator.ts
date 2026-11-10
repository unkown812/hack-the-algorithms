import { getAlgorithmById } from '../../algorithms/registry';

export interface MemoryEstimate {
  bytes: number;
  description: string;
}

export class MemoryEstimator {
  estimate(algorithmId: string, inputSize: number): MemoryEstimate {
    const algorithm = getAlgorithmById(algorithmId);
    if (!algorithm) {
      return { bytes: 0, description: 'Algorithm not found' };
    }

    const auxSpace = algorithm.spaceComplexity.auxiliary;
    const bytes = this.calculateBytes(auxSpace, inputSize);
    return {
      bytes,
      description: `Estimated auxiliary space for ${algorithm.name} with input size ${inputSize}.`,
    };
  }

  private calculateBytes(complexity: string, inputSize: number): number {
    const norm = complexity.trim().toUpperCase();
    if (norm === 'O(1)') {return 64;}
    if (norm === 'O(LOG N)') {return 64 + Math.ceil(Math.log2(Math.max(1, inputSize))) * 8;}
    if (norm === 'O(N)') {return 64 + inputSize * 8;}
    if (norm === 'O(N LOG N)') {return 64 + inputSize * Math.ceil(Math.log2(Math.max(1, inputSize))) * 8;}
    if (norm === 'O(N²)') {return 64 + inputSize * inputSize * 8;}
    if (norm === 'O(N³)') {return 64 + inputSize * inputSize * inputSize * 8;}
    return 64;
  }
}