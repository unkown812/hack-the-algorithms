import { FunctionComponent, useEffect } from 'react';
import type {
  CompileDiagnostic,
  ExecutionResult,
} from '../../../core/playground/types';
import type { InstrumentedRunResult } from '../../../core/complexity/counters/engine';
import type { Algorithm } from '../../../core/algorithms';
import type { ExecutionStep } from '../../../core/visualization/types';
import {
  aiContextRegistry,
  visualizationContextItem,
} from '../../services/aiContextRegistry';

/**
 * Publishes the current state of a page as context for the assistant.
 *
 * Publishing makes an item *available* — it is not shared with a provider
 * before the student attaches it explicitly in the assistant.
 */
export const AIContextPublisher: FunctionComponent<{
  /** The algorithm the student is looking at. */
  algorithm?: Algorithm;
  /** The current step of the visualization. */
  step?: ExecutionStep;
  stepIndex?: number;
  totalSteps?: number;
  /** The origin of the page — the items of a page are replaced together. */
  origin: string;
}> = ({ algorithm, step, stepIndex = 0, totalSteps = 0, origin }) => {
  useEffect(() => {
    if (algorithm) {
      aiContextRegistry.publish({
        id: `algorithm-${algorithm.id}`,
        kind: 'algorithm',
        label: `Algorithm — ${algorithm.name}`,
        content: [
          `Name: ${algorithm.name}`,
          `Category: ${algorithm.category}`,
          `Difficulty: ${algorithm.difficulty}`,
          '',
          algorithm.description,
          '',
          algorithm.theory,
          '',
          `Problem statement: ${algorithm.problemStatement}`,
          `Approach: ${algorithm.approach}`,
          '',
          'Pseudocode:',
          ...algorithm.pseudocode,
          '',
          `Time complexity — best ${algorithm.timeComplexity.best}, average ${algorithm.timeComplexity.average}, worst ${algorithm.timeComplexity.worst}`,
          `Space complexity — auxiliary ${algorithm.spaceComplexity.auxiliary}`,
        ].join('\n'),
        source: 'Algorithm registry',
        origin,
      });
    }
  }, [algorithm, origin]);

  useEffect(() => {
    if (algorithm && step) {
      aiContextRegistry.publish(
        visualizationContextItem(
          algorithm.id,
          algorithm.name,
          step,
          stepIndex,
          totalSteps
        )
      );
    }
  }, [algorithm, step, stepIndex, totalSteps]);

  return null;
};

/**
 * Publishes the state of the code playground as context for the assistant.
 *
 * Only what the student already sees in the playground is published: the
 * current source, the diagnostics of the last compilation and the result of
 * the last run. Publishing does not share anything — the student attaches an
 * item explicitly before it is sent to a provider.
 */
export const PlaygroundContextPublisher: FunctionComponent<{
  source: string;
  diagnostics: CompileDiagnostic[];
  executionResult: ExecutionResult | null;
}> = ({ source, diagnostics, executionResult }) => {
  useEffect(() => {
    if (source.trim()) {
      aiContextRegistry.publish({
        id: 'playground-source',
        kind: 'code',
        label: 'Playground — current program',
        content: source,
        source: 'User selection',
        origin: 'playground',
      });
    }
  }, [source]);

  useEffect(() => {
    if (diagnostics.length === 0) {
      return;
    }

    aiContextRegistry.publish({
      id: 'playground-diagnostics',
      kind: 'diagnostics',
      label: 'Compiler diagnostics',
      source: 'Phase 5 compiler',
      origin: 'playground',
      content: diagnostics
        .map(
          (diagnostic) =>
            `${diagnostic.severity.toUpperCase()} ${diagnostic.file}:${diagnostic.line}${
              diagnostic.column ? `:${diagnostic.column}` : ''
            } — ${diagnostic.message}\n${diagnostic.explanation}`
        )
        .join('\n\n'),
    });
  }, [diagnostics]);

  useEffect(() => {
    if (!executionResult) {
      return;
    }

    aiContextRegistry.publish({
      id: 'playground-execution',
      kind: 'execution',
      label: 'Execution result',
      source: 'Phase 5 execution engine',
      origin: 'playground',
      content: [
        `Status: ${executionResult.status}`,
        `Exit code: ${executionResult.exitCode ?? 'none'}`,
        `Duration: ${executionResult.durationMs} ms`,
        executionResult.commandLine ? `Command: ${executionResult.commandLine}` : '',
        '',
        'Standard output:',
        executionResult.stdout || '(empty)',
        '',
        'Standard error:',
        executionResult.stderr || '(empty)',
      ]
        .filter((line) => line !== '')
        .join('\n'),
    });
  }, [executionResult]);

  return null;
};

/**
 * Publishes the result of the complexity analyzer as context.
 *
 * The theoretical classes, the counted operations and the measured time stay
 * apart — the assistant interprets the numbers, it never recalculates them.
 */
export const ComplexityContextPublisher: FunctionComponent<{
  algorithm?: Algorithm;
  run: InstrumentedRunResult | null;
}> = ({ algorithm, run }) => {
  useEffect(() => {
    if (!algorithm || !run) {
      return;
    }

    aiContextRegistry.publish({
      id: `complexity-${algorithm.id}`,
      kind: 'complexity',
      label: 'Complexity analysis',
      source: 'Phase 4 complexity analyzer',
      origin: 'analyzer',
      content: [
        'Theoretical complexity:',
        `  Best case: ${algorithm.timeComplexity.best}`,
        `  Average case: ${algorithm.timeComplexity.average}`,
        `  Worst case: ${algorithm.timeComplexity.worst}`,
        `  Auxiliary space: ${algorithm.spaceComplexity.auxiliary}`,
        '',
        'Instrumented operation counts (deterministic, counted while the algorithm ran):',
        `  Input size: ${run.inputSize}`,
        `  Comparisons: ${run.metrics.comparisons}`,
        `  Exchanges: ${run.metrics.swaps}`,
        `  Total counted operations: ${run.metrics.totalOperations}`,
        '',
        'The counts were produced by the instrumented engine — they are deterministic',
        'counts of this input, not an estimate.',
      ].join('\n'),
    });
  }, [algorithm, run]);

  return null;
};
