import type { AlgorithmMetadata } from '../../shared/types';

export interface CoreAlgorithm extends AlgorithmMetadata {
  sourcePath?: string;
  practicalPath?: string;
}

export interface AlgorithmRegistry {
  getAll(): CoreAlgorithm[];
  getById(id: string): CoreAlgorithm | undefined;
  getByCategory(category: string): CoreAlgorithm[];
  register(algorithm: CoreAlgorithm): void;
}
