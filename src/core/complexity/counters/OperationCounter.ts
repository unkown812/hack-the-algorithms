import type { OperationMetrics } from '../types/OperationMetrics';
import { CountingPolicy } from './CountingPolicy';

export interface CounterSnapshot {
  metrics: OperationMetrics;
  timestamp: number;
}

export class OperationCounter {
  private metrics: OperationMetrics = {
    comparisons: 0,
    swaps: 0,
    assignments: 0,
    arrayAccesses: 0,
    arrayWrites: 0,
    loopIterations: 0,
    recursiveCalls: 0,
    functionCalls: 0,
    arithmeticOperations: 0,
    allocations: 0,
    deallocations: 0,
    totalOperations: 0,
  };

  private policy: CountingPolicy;
  private snapshots: CounterSnapshot[] = [];

  constructor(policy?: CountingPolicy) {
    this.policy = policy ?? new CountingPolicy();
  }

  increment(type: keyof Omit<OperationMetrics, 'totalOperations'>, by: number = 1): void {
    if (!this.policy.isCountingEnabled(type)) {return;}
    (this.metrics[type] as number) += by;
    this.updateTotal();
  }

  incrementComparison(by: number = 1): void {
    this.increment('comparisons', by);
  }

  incrementSwap(by: number = 1): void {
    this.increment('swaps', by);
  }

  incrementAssignment(by: number = 1): void {
    this.increment('assignments', by);
  }

  incrementArrayAccess(by: number = 1): void {
    this.increment('arrayAccesses', by);
  }

  incrementArrayWrite(by: number = 1): void {
    this.increment('arrayWrites', by);
  }

  incrementLoopIteration(by: number = 1): void {
    this.increment('loopIterations', by);
  }

  incrementRecursiveCall(by: number = 1): void {
    this.increment('recursiveCalls', by);
  }

  incrementFunctionCall(by: number = 1): void {
    this.increment('functionCalls', by);
  }

  incrementArithmeticOperation(by: number = 1): void {
    this.increment('arithmeticOperations', by);
  }

  incrementAllocation(by: number = 1): void {
    this.increment('allocations', by);
  }

  incrementDeallocation(by: number = 1): void {
    this.increment('deallocations', by);
  }

  private updateTotal(): void {
    this.metrics.totalOperations =
      this.metrics.comparisons +
      this.metrics.swaps +
      this.metrics.assignments +
      this.metrics.arrayAccesses +
      this.metrics.arrayWrites +
      this.metrics.loopIterations +
      this.metrics.recursiveCalls +
      this.metrics.functionCalls +
      this.metrics.arithmeticOperations +
      this.metrics.allocations +
      this.metrics.deallocations;
  }

  getMetrics(): OperationMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      comparisons: 0,
      swaps: 0,
      assignments: 0,
      arrayAccesses: 0,
      arrayWrites: 0,
      loopIterations: 0,
      recursiveCalls: 0,
      functionCalls: 0,
      arithmeticOperations: 0,
      allocations: 0,
      deallocations: 0,
      totalOperations: 0,
    };
  }

  snapshot(): CounterSnapshot {
    const snap: CounterSnapshot = {
      metrics: { ...this.metrics },
      timestamp: Date.now(),
    };
    this.snapshots.push(snap);
    return snap;
  }

  getSnapshots(): CounterSnapshot[] {
    return [...this.snapshots];
  }

  clearSnapshots(): void {
    this.snapshots = [];
  }
}