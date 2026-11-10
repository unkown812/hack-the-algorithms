export type VisualStateType =
  | 'default'
  | 'active'
  | 'comparing'
  | 'selected'
  | 'swapping'
  | 'updated'
  | 'sorted'
  | 'found'
  | 'eliminated';

export type AlgorithmStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'reset';

export interface VisualStyle {
  state: VisualStateType;
  color?: string;
  label?: string;
}

export interface ArrayState {
  values: number[];
  length: number;
  elementStyles: Record<number, VisualStyle>;
}

export interface GraphNode {
  id: string | number;
  label: string | number;
  x: number;
  y: number;
}

export interface GraphEdge {
  source: string | number;
  target: string | number;
  weight?: number;
  directed?: boolean;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeStyles: Record<string | number, VisualStyle>;
  edgeStyles: Record<string, VisualStyle>;
}

export interface MatrixState {
  rows: number;
  cols: number;
  cells: (number | string)[][];
  cellStyles: Record<string, VisualStyle>;
}

export interface TreeNode {
  id: string | number;
  label: string | number;
  parentId?: string | number;
  children: (string | number)[];
}

export interface TreeState {
  nodes: TreeNode[];
  nodeStyles: Record<string | number, VisualStyle>;
}

export interface VisualizationState {
  array?: ArrayState;
  graph?: GraphState;
  matrix?: MatrixState;
  tree?: TreeState;
  variables: Record<string, unknown>;
  stepIndex: number;
  status: AlgorithmStatus;
}

export interface ComplexityCounters {
  operations: number;
  comparisons: number;
  swaps: number;
  iterations: number;
}

export interface ExecutionStep {
  id: number;
  description: string;
  operation: string;
  lineNumber?: number;
  currentState: VisualizationState;
  highlightedElements?: number[];
  comparedElements?: number[];
  swappedElements?: number[];
  updatedElements?: number[];
  variables?: Record<string, unknown>;
  explanation: string;
  complexity: ComplexityCounters;
}

export interface AlgorithmTrace {
  algorithmId: string;
  algorithmName: string;
  category: string;
  input: unknown;
  steps: ExecutionStep[];
  initialState: VisualizationState;
  finalState: VisualizationState;
  totalOperations: number;
  totalComparisons: number;
  totalSwaps: number;
  status: 'completed' | 'failed';
}

export interface VisualizationConfig {
  algorithmId: string;
  input: unknown;
  playbackSpeed: number;
  maxInputSize: number;
  showPseudocode: boolean;
  showExplanation: boolean;
  showVariables: boolean;
  showComplexity: boolean;
}

export const DEFAULT_VISUALIZATION_CONFIG: VisualizationConfig = {
  algorithmId: '',
  input: null,
  playbackSpeed: 1,
  maxInputSize: 50,
  showPseudocode: true,
  showExplanation: true,
  showVariables: true,
  showComplexity: true,
};

export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4];
