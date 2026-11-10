import type { OperationMetrics } from './OperationMetrics';

export interface AlgorithmComparisonEntry {
  algorithmId: string;
  algorithmName: string;
  theoreticalBest: string;
  theoreticalAverage: string;
  theoreticalWorst: string;
  auxiliarySpace: string;
  operationMetrics: OperationMetrics;
  executionTimeMs?: number;
  inputSize: number;
  scenario: string;
  outputValid?: boolean;
}

export interface ComparisonResult {
  algorithms: AlgorithmComparisonEntry[];
  inputSize: number;
  scenario: string;
  timestamp: number;
  sameInput: boolean;
  outputsEquivalent?: boolean;
}