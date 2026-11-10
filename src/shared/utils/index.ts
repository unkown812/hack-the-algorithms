import type { AlgorithmMetadata } from '../types';

export function findAlgorithmById(
  algorithms: AlgorithmMetadata[],
  id: string
): AlgorithmMetadata | undefined {
  return algorithms.find((algo) => algo.id === id);
}

export function filterAlgorithmsByCategory(
  algorithms: AlgorithmMetadata[],
  categoryId: string
): AlgorithmMetadata[] {
  return algorithms.filter((algo) => algo.category === categoryId);
}

export function searchAlgorithms(
  algorithms: AlgorithmMetadata[],
  query: string
): AlgorithmMetadata[] {
  const lowercaseQuery = query.toLowerCase().trim();
  if (!lowercaseQuery) {
    return algorithms;
  }
  return algorithms.filter(
    (algo) =>
      algo.name.toLowerCase().includes(lowercaseQuery) ||
      algo.description.toLowerCase().includes(lowercaseQuery) ||
      algo.tags.some((tag: string) => tag.toLowerCase().includes(lowercaseQuery)) ||
      algo.category.toLowerCase().includes(lowercaseQuery)
  );
}

export function sortAlgorithmsByName(
  algorithms: AlgorithmMetadata[]
): AlgorithmMetadata[] {
  return [...algorithms].sort((a, b) => a.name.localeCompare(b.name));
}

export function getAlgorithmCountByCategory(
  algorithms: AlgorithmMetadata[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const algo of algorithms) {
    counts[algo.category] = (counts[algo.category] || 0) + 1;
  }
  return counts;
}

export function formatComplexity(value: string): string {
  return value.replace(/O\(([^)]+)\)/, 'O($1)');
}
