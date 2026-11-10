export interface WebviewMessage {
  type: string;
  payload?: unknown;
}

export interface ExtensionMessage {
  type: string;
  payload?: unknown;
}

export type MessageType =
  | 'GET_ALGORITHMS'
  | 'GET_ALGORITHM_DETAIL'
  | 'ALGORITHMS_DATA'
  | 'ALGORITHM_DETAIL';

export interface Algorithm {
  id: string;
  name: string;
  category: string;
  difficulty: string;
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
  spaceComplexity: {
    auxiliary: string;
    total?: string;
  };
  useCases: string[];
  relatedAlgorithms: string[];
  tags: string[];
}
