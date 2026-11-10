import type { Algorithm } from './types';
import { BINARY_SEARCH } from './searching/binary-search';
import { LINEAR_SEARCH } from './searching/linear-search';
import { BUBBLE_SORT } from './sorting/bubble-sort';
import { SELECTION_SORT } from './sorting/selection-sort';
import { INSERTION_SORT } from './sorting/insertion-sort';
import { MERGE_SORT } from './sorting/merge-sort';
import { QUICK_SORT } from './sorting/quick-sort';

const ALGORITHMS: Record<string, Algorithm> = {
  [BINARY_SEARCH.id]: BINARY_SEARCH,
  [LINEAR_SEARCH.id]: LINEAR_SEARCH,
  [BUBBLE_SORT.id]: BUBBLE_SORT,
  [SELECTION_SORT.id]: SELECTION_SORT,
  [INSERTION_SORT.id]: INSERTION_SORT,
  [MERGE_SORT.id]: MERGE_SORT,
  [QUICK_SORT.id]: QUICK_SORT,
};

export const ALL_ALGORITHMS: Algorithm[] = Object.values(ALGORITHMS);

export function getAlgorithmById(id: string): Algorithm | undefined {
  return ALGORITHMS[id];
}

export function getAlgorithmsByCategory(category: string): Algorithm[] {
  return ALL_ALGORITHMS.filter((algo) => algo.category === category);
}

export function getAllAlgorithms(): Algorithm[] {
  return [...ALL_ALGORITHMS];
}

export function searchAlgorithms(query: string): Algorithm[] {
  const lowercaseQuery = query.toLowerCase().trim();
  if (!lowercaseQuery) {
    return ALL_ALGORITHMS;
  }
  return ALL_ALGORITHMS.filter(
    (algo) =>
      algo.name.toLowerCase().includes(lowercaseQuery) ||
      algo.description.toLowerCase().includes(lowercaseQuery) ||
      algo.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)) ||
      algo.category.toLowerCase().includes(lowercaseQuery)
  );
}
