import { OperationCounter } from './OperationCounter';
import { CountingPolicy, DEFAULT_COUNTING_POLICY } from './CountingPolicy';

export interface CounterRegistryEntry {
  algorithmId: string;
  counter: OperationCounter;
  policy: CountingPolicy;
}

export class CounterRegistry {
  private counters: Map<string, OperationCounter> = new Map();
  private defaultPolicy: CountingPolicy = DEFAULT_COUNTING_POLICY;

  getCounter(algorithmId: string): OperationCounter {
    let counter = this.counters.get(algorithmId);
    if (!counter) {
      counter = new OperationCounter(this.defaultPolicy);
      this.counters.set(algorithmId, counter);
    }
    return counter;
  }

  hasCounter(algorithmId: string): boolean {
    return this.counters.has(algorithmId);
  }

  removeCounter(algorithmId: string): boolean {
    return this.counters.delete(algorithmId);
  }

  clearAll(): void {
    this.counters.clear();
  }

  getRegisteredAlgorithms(): string[] {
    return Array.from(this.counters.keys());
  }

  snapshotAll(): Record<string, ReturnType<OperationCounter['getMetrics']>> {
    const result: Record<string, ReturnType<OperationCounter['getMetrics']>> = {};
    for (const [algoId, counter] of this.counters) {
      result[algoId] = counter.getMetrics();
    }
    return result;
  }

  resetAll(): void {
    for (const counter of this.counters.values()) {
      counter.reset();
    }
  }

  setDefaultPolicy(policy: CountingPolicy): void {
    this.defaultPolicy = policy;
  }
}

export const counterRegistry = new CounterRegistry();