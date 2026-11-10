import type { Algorithm } from '../../core/algorithms';

export class AlgorithmService {
  private algorithms: Algorithm[] = [];

  constructor() {
    this.refresh();
  }

  refresh(): void {
    const { getAllAlgorithms } = require('../../core/algorithms');
    this.algorithms = getAllAlgorithms();
  }

  getAll(): Algorithm[] {
    return [...this.algorithms];
  }

  getById(id: string): Algorithm | undefined {
    return this.algorithms.find((algo) => algo.id === id);
  }

  getByCategory(category: string): Algorithm[] {
    return this.algorithms.filter((algo) => algo.category === category);
  }

  search(query: string): Algorithm[] {
    const lowercaseQuery = query.toLowerCase().trim();
    if (!lowercaseQuery) {
      return this.getAll();
    }
    return this.algorithms.filter(
      (algo) =>
        algo.name.toLowerCase().includes(lowercaseQuery) ||
        algo.description.toLowerCase().includes(lowercaseQuery) ||
        algo.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)) ||
        algo.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  getCategories(): string[] {
    return [...new Set(this.algorithms.map((a) => a.category))];
  }

  getCount(): number {
    return this.algorithms.length;
  }
}

export const algorithmService = new AlgorithmService();
