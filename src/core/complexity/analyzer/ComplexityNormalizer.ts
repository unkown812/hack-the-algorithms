export interface ComplexityClass {
  name: string;
  growthRate: (n: number) => number;
  description: string;
  /** Chart colour used by the growth visualisations. */
  color?: string;
}

export const COMPLEXITY_CLASSES: ComplexityClass[] = [
  {
    name: 'O(1)',
    growthRate: () => 1,
    description: 'Constant time - execution time does not depend on input size.',
    color: '#22c55e',
  },
  {
    name: 'O(log n)',
    growthRate: (n: number) => (n > 0 ? Math.log2(n) : 0),
    description: 'Logarithmic time - input size halves at each step.',
    color: '#14b8a6',
  },
  {
    name: 'O(n)',
    growthRate: (n: number) => n,
    description: 'Linear time - execution time grows proportionally with input size.',
    color: '#3b82f6',
  },
  {
    name: 'O(n log n)',
    growthRate: (n: number) => (n > 0 ? n * Math.log2(n) : 0),
    description: 'Linearithmic time - common in efficient sorting and divide-and-conquer algorithms.',
    color: '#8b5cf6',
  },
  {
    name: 'O(n²)',
    growthRate: (n: number) => n * n,
    description: 'Quadratic time - common in nested loop algorithms.',
    color: '#f59e0b',
  },
  {
    name: 'O(n³)',
    growthRate: (n: number) => n * n * n,
    description: 'Cubic time - common in triple nested loops.',
    color: '#f97316',
  },
  {
    name: 'O(2ⁿ)',
    growthRate: (n: number) => Math.pow(2, n),
    description: 'Exponential time - common in brute-force algorithms.',
    color: '#ef4444',
  },
  {
    name: 'O(n!)',
    growthRate: (n: number) => {
      if (n <= 1) {return 1;}
      let result = 1;
      for (let i = 2; i <= n; i++) {result *= i;}
      return result;
    },
    description: 'Factorial time - common in permutation-based algorithms.',
    color: '#ec4899',
  },
];

export function getComplexityClass(name: string): ComplexityClass | undefined {
  return COMPLEXITY_CLASSES.find((c) => c.name === name);
}

export function normalizeComplexityNotation(notation: string): string {
  const normalized = notation.trim().toUpperCase();
  const match = normalized.match(/^O\((.+)\)$/);
  if (match) {
    return `O(${match[1].toLowerCase()})`;
  }
  return notation;
}

export function compareComplexity(a: string, b: string): number {
  const order = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)', 'O(n!)'];
  const idxA = order.indexOf(a);
  const idxB = order.indexOf(b);
  if (idxA === -1 && idxB === -1) {return 0;}
  if (idxA === -1) {return 1;}
  if (idxB === -1) {return -1;}
  return idxA - idxB;
}

export function getDominantTerm(notation: string): string {
  const normalized = normalizeComplexityNotation(notation);
  const parts = normalized.match(/^O\((.+)\)$/);
  if (!parts) {return normalized;}
  const inner = parts[1];
  if (inner.includes('+')) {
    const terms = inner.split('+').map((t) => t.trim());
    const sorted = terms.sort((a, b) => {
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
      return (order[a] ?? 99) - (order[b] ?? 99);
    });
    return `O(${sorted[sorted.length - 1]})`;
  }
  return normalized;
}