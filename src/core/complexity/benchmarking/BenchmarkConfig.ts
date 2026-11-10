export interface BenchmarkConfig {
  algorithmId: string;
  inputSize: number;
  scenario: string;
  trials: number;
  warmupRuns: number;
  timeoutMs: number;
  maxInputSize: number;
}

export const DEFAULT_BENCHMARK_CONFIG: Omit<BenchmarkConfig, 'algorithmId' | 'inputSize' | 'scenario'> = {
  trials: 5,
  warmupRuns: 2,
  timeoutMs: 30000,
  maxInputSize: 10000,
};

export const INPUT_SIZE_PRESETS = [10, 50, 100, 500, 1000, 5000];

export const MAX_INPUT_LIMITS: Record<string, number> = {
  'bubble-sort': 1000,
  'selection-sort': 1000,
  'insertion-sort': 1000,
  'merge-sort': 10000,
  'quick-sort': 10000,
  'linear-search': 100000,
  'binary-search': 100000,
};