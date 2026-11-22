export interface SpaceMetrics {
  theoreticalAuxiliary: string;
  estimatedBytes?: number;
  measuredAllocations?: number;
  measuredDeallocations?: number;
  measuredStackDepth?: number;
  estimatedTotalBytes?: number;
}

export interface SpaceAnalysis {
  algorithmId: string;
  inputSize: number;
  theoreticalAuxiliary: string;
  theoreticalTotal?: string;
  estimatedAuxiliaryBytes?: number;
  measuredAllocations?: number;
  measuredDeallocations?: number;
  measuredStackDepth?: number;
  /** Peak simultaneously-held auxiliary bytes recorded by the instrumented run. */
  measuredPeakBytes?: number;
  /** Deepest recursion frame observed by the instrumented run. */
  measuredRecursionDepth?: number;
  notes?: string;
}