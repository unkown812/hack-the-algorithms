export interface CounterPolicy {
  name: string;
  description: string;
  enabled: boolean;
  incrementBy?: number;
}

export class CountingPolicy {
  private policies: Map<string, CounterPolicy> = new Map();

  register(name: string, policy: CounterPolicy): void {
    this.policies.set(name, policy);
  }

  isCountingEnabled(name: string): boolean {
    const policy = this.policies.get(name);
    return policy ? policy.enabled : true;
  }

  getIncrement(name: string): number {
    const policy = this.policies.get(name);
    return policy?.incrementBy ?? 1;
  }

  setEnabled(name: string, enabled: boolean): void {
    const policy = this.policies.get(name);
    if (policy) {
      policy.enabled = enabled;
    }
  }

  getPolicies(): CounterPolicy[] {
    return Array.from(this.policies.values());
  }
}

export const DEFAULT_COUNTING_POLICY = new CountingPolicy();
DEFAULT_COUNTING_POLICY.register('comparisons', {
  name: 'comparisons',
  description: 'Number of comparison operations performed',
  enabled: true,
  incrementBy: 1,
});
DEFAULT_COUNTING_POLICY.register('swaps', {
  name: 'swaps',
  description: 'Number of swap operations (may include multiple assignments)',
  enabled: true,
  incrementBy: 1,
});
DEFAULT_COUNTING_POLICY.register('assignments', {
  name: 'assignments',
  description: 'Number of direct variable assignments',
  enabled: true,
  incrementBy: 1,
});
DEFAULT_COUNTING_POLICY.register('arrayAccesses', {
  name: 'arrayAccesses',
  description: 'Number of array element reads',
  enabled: true,
  incrementBy: 1,
});
DEFAULT_COUNTING_POLICY.register('arrayWrites', {
  name: 'arrayWrites',
  description: 'Number of array element writes',
  enabled: true,
  incrementBy: 1,
});
DEFAULT_COUNTING_POLICY.register('loopIterations', {
  name: 'loopIterations',
  description: 'Number of loop body executions',
  enabled: true,
  incrementBy: 1,
});
DEFAULT_COUNTING_POLICY.register('recursiveCalls', {
  name: 'recursiveCalls',
  description: 'Number of recursive function calls',
  enabled: true,
  incrementBy: 1,
});
DEFAULT_COUNTING_POLICY.register('functionCalls', {
  name: 'functionCalls',
  description: 'Number of non-recursive function calls',
  enabled: true,
  incrementBy: 1,
});
DEFAULT_COUNTING_POLICY.register('arithmeticOperations', {
  name: 'arithmeticOperations',
  description: 'Number of arithmetic operations (+, -, *, /)',
  enabled: true,
  incrementBy: 1,
});
DEFAULT_COUNTING_POLICY.register('allocations', {
  name: 'allocations',
  description: 'Number of memory allocations',
  enabled: true,
  incrementBy: 1,
});
DEFAULT_COUNTING_POLICY.register('deallocations', {
  name: 'deallocations',
  description: 'Number of memory deallocations',
  enabled: true,
  incrementBy: 1,
});