export interface LoopAnalysis {
  loopType: 'for' | 'while' | 'do-while' | 'nested' | 'unknown';
  iterations: number;
  complexity: string;
  explanation: string;
}

export class LoopAnalyzer {
  analyzeLoop(
    type: 'for' | 'while' | 'do-while',
    iterations: number | ((n: number) => number),
    nested: boolean = false,
    innerComplexity?: string
  ): LoopAnalysis {
    let complexity: string;
    let explanation: string;

    if (typeof iterations === 'function') {
      const growth = iterations(100);
      if (growth <= 1) {
        complexity = 'O(1)';
        explanation = 'Loop runs a constant number of times.';
      } else if (growth <= 10) {
        complexity = 'O(log n)';
        explanation = 'Loop runs logarithmically (e.g., halving each iteration).';
      } else if (growth <= 100) {
        complexity = 'O(n)';
        explanation = 'Loop runs linearly with input size.';
      } else {
        complexity = 'O(n²)';
        explanation = 'Loop runs quadratically or worse.';
      }
    } else {
      if (iterations <= 1) {
        complexity = 'O(1)';
        explanation = 'Loop runs a constant number of times.';
      } else if (iterations <= 10) {
        complexity = 'O(log n)';
        explanation = 'Loop runs logarithmically.';
      } else {
        complexity = 'O(n)';
        explanation = 'Loop runs linearly.';
      }
    }

    if (nested && innerComplexity) {
      complexity = multiplyComplexity(complexity, innerComplexity);
      explanation = `Nested loop: outer is ${complexity}, inner is ${innerComplexity}.`;
    }

    return {
      loopType: type,
      iterations: typeof iterations === 'number' ? iterations : 0,
      complexity,
      explanation,
    };
  }
}

export function multiplyComplexity(a: string, b: string): string {
  const normA = a.replace(/^O\(|\)$/g, '');
  const normB = b.replace(/^O\(|\)$/g, '');

  if (normA === '1' || normB === '1') {
    return normA === '1' ? `O(${normB})` : `O(${normA})`;
  }

  const order: Record<string, number> = {
    '1': 0,
    'log n': 1,
    'n': 2,
    'n log n': 3,
    'n²': 4,
    'n³': 5,
    '2ⁿ': 6,
    'n!': 7,
  };

  const aOrder = order[normA] ?? 99;
  const bOrder = order[normB] ?? 99;

  if (aOrder === 2 && bOrder === 2) {return 'O(n²)';}
  if (aOrder === 2 && bOrder === 3) {return 'O(n² log n)';}
  if (aOrder === 3 && bOrder === 2) {return 'O(n² log n)';}
  if (aOrder === 2 && bOrder === 4) {return 'O(n³)';}
  if (aOrder === 4 && bOrder === 2) {return 'O(n³)';}

  return `O(${normA} * ${normB})`;
}