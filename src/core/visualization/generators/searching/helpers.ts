import type {
  ExecutionStep,
  VisualStyle,
  VisualStateType,
} from '../../types';

export function validateSearchInput(input: unknown): {
  valid: boolean;
  error?: string;
  values?: number[];
  target?: number;
} {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, error: 'Input must be an object with array and target fields.' };
  }
  const obj = input as { array?: unknown; target?: unknown };
  if (!Array.isArray(obj.array)) {
    return { valid: false, error: 'Input must include an array of numbers.' };
  }
  if (obj.array.length === 0) {
    return { valid: false, error: 'Array must contain at least one element.' };
  }
  for (const item of obj.array) {
    if (typeof item !== 'number') {
      return { valid: false, error: 'All array elements must be numbers.' };
    }
  }
  if (typeof obj.target !== 'number') {
    return { valid: false, error: 'Target must be a number.' };
  }
  return { valid: true, values: obj.array as number[], target: obj.target as number };
}

export function createSearchStep(
  id: number,
  description: string,
  operation: string,
  array: number[],
  variables: Record<string, unknown>,
  counters: { operations: number; comparisons: number },
  options: {
    lineNumber?: number;
    currentIndex?: number;
    comparedElements?: number[];
    foundIndex?: number;
    eliminatedRange?: { start: number; end: number };
    state?: VisualStateType;
    stateIndices?: number[];
    explanation?: string;
  } = {}
): ExecutionStep {
  const styles: Record<number, VisualStyle> = {};
  const state = options.state ?? 'default';
  const stateIndices: number[] = [];
  if (options.currentIndex !== undefined) {
    stateIndices.push(options.currentIndex);
  }
  if (options.comparedElements) {
    stateIndices.push(...options.comparedElements);
  }
  if (options.foundIndex !== undefined) {
    stateIndices.push(options.foundIndex);
  }
  if (options.stateIndices) {
    stateIndices.push(...options.stateIndices);
  }

  for (let i = 0; i < array.length; i++) {
    styles[i] = { state };
  }
  for (const idx of stateIndices) {
    if (idx >= 0 && idx < array.length) {
      styles[idx] = { state };
    }
  }

  if (options.eliminatedRange) {
    for (let i = options.eliminatedRange.start; i <= options.eliminatedRange.end; i++) {
      if (i >= 0 && i < array.length) {
        styles[i] = { state: 'eliminated' };
      }
    }
  }
  if (options.foundIndex !== undefined) {
    styles[options.foundIndex] = { state: 'found' };
  }

  return {
    id,
    description,
    operation,
    lineNumber: options.lineNumber,
    currentState: {
      array: {
        values: [...array],
        length: array.length,
        elementStyles: styles,
      },
      variables: { ...variables },
      stepIndex: id,
      status: 'completed',
    },
    comparedElements: options.comparedElements,
    variables: { ...variables },
    explanation: options.explanation ?? '',
    complexity: {
      operations: counters.operations,
      comparisons: counters.comparisons,
      swaps: 0,
      iterations: 0,
    },
  };
}
