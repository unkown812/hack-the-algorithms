export interface OperationMetrics {
  comparisons: number;
  swaps: number;
  assignments: number;
  arrayAccesses: number;
  arrayWrites: number;
  loopIterations: number;
  recursiveCalls: number;
  functionCalls: number;
  arithmeticOperations: number;
  allocations: number;
  deallocations: number;
  totalOperations: number;
}

export const EMPTY_OPERATION_METRICS: OperationMetrics = {
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

export function createOperationMetrics(
  overrides: Partial<OperationMetrics> = {}
): OperationMetrics {
  return { ...EMPTY_OPERATION_METRICS, ...overrides };
}

export function addMetrics(
  a: OperationMetrics,
  b: OperationMetrics
): OperationMetrics {
  return {
    comparisons: a.comparisons + b.comparisons,
    swaps: a.swaps + b.swaps,
    assignments: a.assignments + b.assignments,
    arrayAccesses: a.arrayAccesses + b.arrayAccesses,
    arrayWrites: a.arrayWrites + b.arrayWrites,
    loopIterations: a.loopIterations + b.loopIterations,
    recursiveCalls: a.recursiveCalls + b.recursiveCalls,
    functionCalls: a.functionCalls + b.functionCalls,
    arithmeticOperations: a.arithmeticOperations + b.arithmeticOperations,
    allocations: a.allocations + b.allocations,
    deallocations: a.deallocations + b.deallocations,
    totalOperations: a.totalOperations + b.totalOperations,
  };
}