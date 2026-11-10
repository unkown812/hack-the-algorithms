export interface ComplexityDerivation {
  explanation: string;
  assumptions?: string[];
  codeSections?: string[];
}

export interface ComplexityCase {
  notation: string;
  explanation: string;
  derivation: ComplexityDerivation;
}

export interface SpaceComplexityDetail {
  auxiliary: {
    notation: string;
    explanation: string;
    derivation: ComplexityDerivation;
  };
  total?: {
    notation: string;
    explanation: string;
    derivation: ComplexityDerivation;
  };
}

export interface DetailedComplexity {
  best: ComplexityCase;
  average: ComplexityCase;
  worst: ComplexityCase;
  space: SpaceComplexityDetail;
}

export interface ComplexityMetadata {
  algorithmId: string;
  timeComplexity: {
    best: string;
    average: string;
    worst: string;
  };
  detailedComplexity?: DetailedComplexity;
  spaceComplexity: {
    auxiliary: string;
    total?: string;
  };
}

import type { OperationMetrics } from './OperationMetrics';

export interface ComplexityAnalysisResult {
  algorithmId: string;
  theoretical: ComplexityMetadata;
  operationMetrics: OperationMetrics;
  inputSize: number;
  scenario?: string;
  timestamp: number;
}