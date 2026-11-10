import type {
  ArrayState,
  VisualizationState,
  VisualStyle,
  VisualStateType,
  ExecutionStep,
  ComplexityCounters,
} from '../../types';

export function createArrayStyle(
  values: number[],
  state: VisualStateType = 'default',
  indices: number[] = []
): Record<number, VisualStyle> {
  const styles: Record<number, VisualStyle> = {};
  for (let i = 0; i < values.length; i++) {
    styles[i] = { state };
  }
  for (const idx of indices) {
    if (idx >= 0 && idx < values.length) {
      styles[idx] = { state };
    }
  }
  return styles;
}

export function createArrayState(
  values: number[],
  styles?: Record<number, VisualStyle>
): ArrayState {
  return {
    values: [...values],
    length: values.length,
    elementStyles: styles ?? {},
  };
}

export function createVisualizationState(
  array: number[],
  variables: Record<string, unknown> = {},
  styles?: Record<number, VisualStyle>
): VisualizationState {
  return {
    array: createArrayState(array, styles),
    variables,
    stepIndex: 0,
    status: 'idle',
  } as VisualizationState;
}

export function createStep(
  id: number,
  description: string,
  operation: string,
  array: number[],
  variables: Record<string, unknown>,
  counters: ComplexityCounters,
  options: {
    lineNumber?: number;
    highlightedElements?: number[];
    comparedElements?: number[];
    swappedElements?: number[];
    updatedElements?: number[];
    state?: VisualStateType;
    stateIndices?: number[];
    explanation?: string;
  } = {}
): ExecutionStep {
  const styles: Record<number, VisualStyle> = {};
  const state = options.state ?? 'default';
  const stateIndices = options.stateIndices ?? [];

  for (let i = 0; i < array.length; i++) {
    styles[i] = { state };
  }
  for (const idx of stateIndices) {
    if (idx >= 0 && idx < array.length) {
      styles[idx] = { state };
    }
  }

  return {
    id,
    description,
    operation,
    lineNumber: options.lineNumber,
    currentState: {
      array: { values: [...array], length: array.length, elementStyles: styles },
      variables: { ...variables },
      stepIndex: id,
      status: 'completed',
    },
    highlightedElements: options.highlightedElements,
    comparedElements: options.comparedElements,
    swappedElements: options.swappedElements,
    updatedElements: options.updatedElements,
    variables: { ...variables },
    explanation: options.explanation ?? '',
    complexity: { ...counters },
  };
}

export function emptyCounters(): ComplexityCounters {
  return { operations: 0, comparisons: 0, swaps: 0, iterations: 0 };
}

export function validateArrayInput(input: unknown): {
  valid: boolean;
  error?: string;
  values?: number[];
} {
  if (!Array.isArray(input)) {
    return { valid: false, error: 'Input must be an array of numbers.' };
  }
  if (input.length === 0) {
    return { valid: false, error: 'Array must contain at least one element.' };
  }
  for (const item of input) {
    if (typeof item !== 'number') {
      return { valid: false, error: 'All array elements must be numbers.' };
    }
  }
  return { valid: true, values: input as number[] };
}
