import type { SpaceMetrics } from '../types/SpaceMetrics';

export interface AllocationRecord {
  type: 'malloc' | 'calloc' | 'realloc' | 'stack' | 'array';
  size: number;
  timestamp: number;
  freed?: boolean;
}

export class AllocationTracker {
  private allocations: AllocationRecord[] = [];
  private currentBytes = 0;
  private peakBytes = 0;

  recordAllocation(type: AllocationRecord['type'], size: number): void {
    const record: AllocationRecord = {
      type,
      size,
      timestamp: Date.now(),
      freed: false,
    };
    this.allocations.push(record);
    this.currentBytes += size;
    if (this.currentBytes > this.peakBytes) {
      this.peakBytes = this.currentBytes;
    }
  }

  recordDeallocation(size: number): void {
    this.currentBytes = Math.max(0, this.currentBytes - size);
    const last = this.allocations[this.allocations.length - 1];
    if (last && !last.freed) {
      last.freed = true;
    }
  }

  getMetrics(): SpaceMetrics {
    const active = this.allocations.filter((a) => !a.freed);
    return {
      theoreticalAuxiliary: 'O(?)',
      measuredAllocations: this.allocations.length,
      measuredDeallocations: this.allocations.filter((a) => a.freed).length,
      measuredStackDepth: active.filter((a) => a.type === 'stack').length,
    };
  }

  reset(): void {
    this.allocations = [];
    this.currentBytes = 0;
    this.peakBytes = 0;
  }

  getPeakBytes(): number {
    return this.peakBytes;
  }

  getCurrentBytes(): number {
    return this.currentBytes;
  }
}