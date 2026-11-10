import type { AlgorithmTrace, ExecutionStep, VisualizationState } from '../../types';
import type { TraceGenerator } from '../../engine/VisualizationEngine';
import { validateSearchInput, createSearchStep } from './helpers';

const ALGORITHM_ID = 'linear-search';
const ALGORITHM_NAME = 'Linear Search';
const CATEGORY = 'searching';

const PSEUDOCODE: string[] = [
  'function linearSearch(a[], n, target):',
  '    for i ← 0 to n - 1 do',
  '        if a[i] == target then',
  '            return i',
  '    return -1',
];

export const LINEAR_SEARCH_GENERATOR: TraceGenerator = {
  generate(input: unknown): AlgorithmTrace {
    const validation = validateSearchInput(input);
    if (!validation.valid || !validation.values || validation.target === undefined) {
      throw new Error(validation.error ?? 'Invalid input');
    }

    const values = [...validation.values];
    const target = validation.target;
    const n = values.length;
    const steps: ExecutionStep[] = [];
    let stepId = 0;
    let comparisons = 0;
    let operations = 0;

    const initialState: VisualizationState = {
      array: {
        values: [...values],
        length: values.length,
        elementStyles: {},
      },
      variables: { i: 0, target, comparisons: 0 },
      stepIndex: 0,
      status: 'idle',
    };

    steps.push(
      createSearchStep(
        stepId++,
        'Initialize linear search.',
        'init',
        values,
        { i: 0, target, comparisons: 0 },
        { operations: 0, comparisons: 0 },
        {
          explanation: `Starting linear search. We scan each element from left to right looking for the target ${target}.`,
        }
      )
    );

    let foundIndex = -1;

    for (let i = 0; i < n; i++) {
      operations++;
      comparisons++;

      steps.push(
        createSearchStep(
          stepId++,
          `Check element ${values[i]} at index ${i} against target ${target}.`,
          'compare',
          values,
          { i, target, comparisons },
          { operations, comparisons },
          {
            lineNumber: 2,
            currentIndex: i,
            comparedElements: [i],
            explanation: `Comparing ${values[i]} at index ${i} with the target ${target}.`,
          }
        )
      );

      if (values[i] === target) {
        foundIndex = i;
        operations++;

        steps.push(
          createSearchStep(
            stepId++,
            `Target ${target} found at index ${i}.`,
            'found',
            values,
            { i, target, comparisons },
            { operations, comparisons },
            {
              lineNumber: 3,
              currentIndex: i,
              foundIndex: i,
              comparedElements: [i],
              explanation: `Found the target ${target} at index ${i}. Search complete.`,
              state: 'found',
            }
          )
        );
        break;
      } else {
        steps.push(
          createSearchStep(
            stepId++,
            `${values[i]} does not match target ${target}. Move to next element.`,
            'not-found',
            values,
            { i, target, comparisons },
            { operations, comparisons },
            {
              lineNumber: 2,
              currentIndex: i,
              comparedElements: [i],
              explanation: `${values[i]} is not the target ${target}. Continuing to the next element.`,
            }
          )
        );
      }
    }

    const finalState: VisualizationState = {
      array: {
        values: [...values],
        length: values.length,
        elementStyles: {},
      },
      variables: { i: foundIndex === -1 ? n : foundIndex, target, comparisons },
      stepIndex: steps.length - 1,
      status: 'completed',
    };

    const lastStep = steps[steps.length - 1];
    if (lastStep) {
      if (foundIndex === -1) {
        lastStep.explanation = `Target ${target} was not found in the array after checking all ${n} elements.`;
        lastStep.operation = 'not-found';
      } else {
        lastStep.explanation = `Search complete. Target ${target} found at index ${foundIndex}.`;
        lastStep.operation = 'found';
      }
    }

    return {
      algorithmId: ALGORITHM_ID,
      algorithmName: ALGORITHM_NAME,
      category: CATEGORY,
      input: { array: values, target },
      steps,
      initialState,
      finalState,
      totalOperations: operations,
      totalComparisons: comparisons,
      totalSwaps: 0,
      status: foundIndex === -1 ? 'completed' : 'completed',
    };
  },
  validateInput(input: unknown): { valid: boolean; error?: string } {
    const result = validateSearchInput(input);
    return { valid: result.valid, error: result.error };
  },
  getDefaultInput(): unknown {
    return { array: [10, 20, 30, 40, 50], target: 30 };
  },
  getPseudocode(): string[] {
    return PSEUDOCODE;
  },
};

export default LINEAR_SEARCH_GENERATOR;
