export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface AlgorithmComplexity {
  best: string;
  average: string;
  worst: string;
}

export interface SpaceComplexity {
  auxiliary: string;
  total?: string;
}

export interface AlgorithmMetadata {
  id: string;
  name: string;
  category: string;
  difficulty: Difficulty;

  description: string;
  theory: string;

  problemStatement: string;

  approach: string;

  pseudocode: string[];

  languageSupport: string[];

  timeComplexity: AlgorithmComplexity;

  spaceComplexity: SpaceComplexity;

  useCases: string[];

  relatedAlgorithms: string[];

  tags: string[];
}

export interface AlgorithmCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  algorithmIds: string[];
}

export interface WebviewMessage {
  type: string;
  payload?: unknown;
}

export interface ExtensionMessage {
  type: string;
  payload?: unknown;
}
