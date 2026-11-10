export interface ComplexityDerivation {
  explanation: string;
  assumptions?: string[];
  codeSections?: string[];
}

export interface DetailedComplexity {
  best: {
    notation: string;
    explanation: string;
    derivation: ComplexityDerivation;
  };
  average: {
    notation: string;
    explanation: string;
    derivation: ComplexityDerivation;
  };
  worst: {
    notation: string;
    explanation: string;
    derivation: ComplexityDerivation;
  };
  space: {
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
  };
}

export interface Algorithm {
  id: string;
  name: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';

  description: string;
  theory: string;

  problemStatement: string;

  approach: string;

  pseudocode: string[];

  languageSupport: string[];

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

  useCases: string[];

  relatedAlgorithms: string[];

  tags: string[];
}
