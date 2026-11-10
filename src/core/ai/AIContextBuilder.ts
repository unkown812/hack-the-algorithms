import { getAlgorithmById } from '../algorithms/registry';
import { retrievalService } from './AIRetrievalService';
import type { KnowledgeDocument } from './AIRetrievalService';
import type { AIContextItem, AIProviderConfig } from './types';

/**
 * Builds the context of a request.
 *
 * Two rules are enforced here:
 *
 * 1. **Only what the student selected is shared.** The builder never walks the
 *    workspace and never collects files on its own.
 * 2. **The context has a budget.** When the selected context is too large it
 *    is truncated, and the truncation is reported to the student.
 */

export interface ContextSelection {
  /** The algorithm the student is looking at. */
  algorithmId?: string;
  /** The source code the student selected. */
  code?: string;
  /** The file name of the selected code. */
  codeFileName?: string;
  /** The current step of the visualization. */
  visualization?: {
    algorithmId: string;
    stepIndex: number;
    description: string;
    explanation: string;
    operation: string;
    lineNumber?: number;
    array?: { values: number[]; comparedIndices?: number[]; swappedIndices?: number[] };
    variables?: Record<string, unknown>;
  };
  /** The diagnostics of the last compilation. */
  diagnostics?: Array<{
    severity: string;
    message: string;
    file: string;
    line: number;
    column: number | null;
    explanation: string;
  }>;
  /** The result of the last execution. */
  execution?: {
    status: string;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    durationMs: number;
  };
  /** The results of the complexity analysis. */
  complexity?: {
    theoretical: { best: string; average: string; worst: string; auxiliary: string };
    instrumented?: { comparisons: number; swaps: number; totalOperations: number };
    measured?: { meanTimeMs: number; trials: number };
  };
  /** The question the student is currently answering. */
  question?: { id: string; title: string; question: string; topic: string };
  /** A summary of the learning progress. */
  progress?: {
    answered: number;
    accuracy: number;
    weakTopics: string[];
    failedChallenges: string[];
  };
}

export interface BuiltContext {
  items: AIContextItem[];
  /** The retrieved documents that were added. */
  documents: KnowledgeDocument[];
  /** True when the context was shortened. */
  truncated: boolean;
  /** The number of characters that were sent. */
  characters: number;
}

export class AIContextBuilder {
  /**
   * Builds the context items from the explicit selection.
   * `query` is the question of the student — it is used to retrieve the
   * matching verified resources.
   */
  build(
    selection: ContextSelection,
    query: string,
    config: AIProviderConfig
  ): BuiltContext {
    const items: AIContextItem[] = [];

    if (selection.algorithmId) {
      const algorithm = getAlgorithmById(selection.algorithmId);
      if (algorithm) {
        items.push({
          id: 'context-algorithm',
          kind: 'algorithm',
          label: `Algorithm — ${algorithm.name}`,
          source: 'Algorithm registry',
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
            `Space complexity — auxiliary ${algorithm.spaceComplexity.auxiliary}${
              algorithm.spaceComplexity.total ? `, total ${algorithm.spaceComplexity.total}` : ''
            }`,
          ].join('\n'),
        });
      }
    }

    if (selection.code && selection.code.trim()) {
      items.push({
        id: 'context-code',
        kind: 'code',
        label: selection.codeFileName
          ? `Selected code — ${selection.codeFileName}`
          : 'Selected code',
        source: 'User selection',
        content: selection.code,
      });
    }

    if (selection.visualization) {
      const step = selection.visualization;
      items.push({
        id: 'context-visualization',
        kind: 'visualization',
        label: `Visualization step — ${step.algorithmId} (step ${step.stepIndex + 1})`,
        source: 'Visualization engine',
        content: [
          `Algorithm: ${step.algorithmId}`,
          `Current step: ${step.stepIndex + 1}`,
          `Operation: ${step.operation}`,
          `Description: ${step.description}`,
          step.lineNumber ? `Source line: ${step.lineNumber}` : '',
          '',
          `Explanation: ${step.explanation}`,
          step.array
            ? `Array: [${step.array.values.join(', ')}]`
            : '',
          step.array?.comparedIndices?.length
            ? `Compared elements: ${step.array.comparedIndices
                .map((index) => `${index} (${step.array?.values[index]})`)
                .join(' and ')}`
            : '',
          step.array?.swappedIndices?.length
            ? `Swapped elements: ${step.array.swappedIndices.join(', ')}`
            : '',
          step.variables && Object.keys(step.variables).length > 0
            ? `Variables: ${Object.entries(step.variables)
                .map(([name, value]) => `${name} = ${String(value)}`)
                .join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n'),
      });
    }

    if (selection.diagnostics && selection.diagnostics.length > 0) {
      items.push({
        id: 'context-diagnostics',
        kind: 'diagnostics',
        label: 'Compiler diagnostics',
        source: 'Phase 5 compiler',
        content: selection.diagnostics
          .map(
            (diagnostic) =>
              `${diagnostic.severity.toUpperCase()} ${diagnostic.file}:${diagnostic.line}${
                diagnostic.column ? `:${diagnostic.column}` : ''
              } — ${diagnostic.message}\n${diagnostic.explanation}`
          )
          .join('\n\n'),
      });
    }

    if (selection.execution) {
      items.push({
        id: 'context-execution',
        kind: 'execution',
        label: 'Execution result',
        source: 'Phase 5 execution engine',
        content: [
          `Status: ${selection.execution.status}`,
          `Exit code: ${selection.execution.exitCode ?? 'none'}`,
          `Duration: ${selection.execution.durationMs} ms`,
          '',
          'Standard output:',
          selection.execution.stdout || '(empty)',
          '',
          'Standard error:',
          selection.execution.stderr || '(empty)',
        ].join('\n'),
      });
    }

    if (selection.complexity) {
      const complexity = selection.complexity;
      items.push({
        id: 'context-complexity',
        kind: 'complexity',
        label: 'Complexity analysis',
        source: 'Phase 4 complexity analyzer',
        content: [
          'Theoretical complexity:',
          `  Best case: ${complexity.theoretical.best}`,
          `  Average case: ${complexity.theoretical.average}`,
          `  Worst case: ${complexity.theoretical.worst}`,
          `  Auxiliary space: ${complexity.theoretical.auxiliary}`,
          complexity.instrumented
            ? '',
            : '',
          complexity.instrumented
            ? `Instrumented operation counts (deterministic, counted while the algorithm ran):`
            : '',
          complexity.instrumented
            ? `  Comparisons: ${complexity.instrumented.comparisons}`
            : '',
          complexity.instrumented ? `  Exchanges: ${complexity.instrumented.swaps}` : '',
          complexity.instrumented
            ? `  Total counted operations: ${complexity.instrumented.totalOperations}`
            : '',
          complexity.measured
            ? '',
            : '',
          complexity.measured
            ? `Measured running time (${complexity.measured.trials} trials in this environment):`
            : '',
          complexity.measured ? `  Mean: ${complexity.measured.meanTimeMs.toFixed(3)} ms` : '',
        ]
          .filter((line) => line !== undefined)
          .join('\n'),
      });
    }

    if (selection.question) {
      items.push({
        id: 'context-question',
        kind: 'question',
        label: `Current question — ${selection.question.title}`,
        source: 'Phase 6 question bank',
        content: `${selection.question.question}\n\nTopic: ${selection.question.topic}`,
      });
    }

    if (selection.progress) {
      items.push({
        id: 'context-progress',
        kind: 'progress',
        label: 'Learning progress',
        source: 'Phase 6 progress data',
        content: [
          `Questions answered: ${selection.progress.answered}`,
          `Accuracy: ${selection.progress.accuracy} %`,
          selection.progress.weakTopics.length
            ? `Topics with a low accuracy: ${selection.progress.weakTopics.join(', ')}`
            : '',
          selection.progress.failedChallenges.length
            ? `Challenges that were not accepted yet: ${selection.progress.failedChallenges.join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n'),
      });
    }

    // The verified learning resources that match the question.
    const documents: KnowledgeDocument[] = [];
    if (config.useLocalResources && query.trim()) {
      documents.push(...retrievalService.search(query, { limit: 3 }));
    }

    return this.applyBudget(items, documents, config);
  }

  /** Applies the context budget and reports the truncation. */
  private applyBudget(
    items: AIContextItem[],
    documents: KnowledgeDocument[],
    config: AIProviderConfig
  ): BuiltContext {
    const budget = config.maxContextCharacters;
    const result: AIContextItem[] = [];
    let characters = 0;
    let truncated = false;

    const push = (item: AIContextItem): void => {
      const size = item.content.length;
      if (characters + size > budget) {
        truncated = true;
        const remaining = budget - characters;
        if (remaining > 200) {
          result.push({
            ...item,
            content: `${item.content.slice(0, remaining)}\n[… the context was shortened …]`,
          });
          characters = budget;
        }
        return;
      }
      result.push(item);
      characters += size;
    };

    for (const item of items) {
      push(item);
    }

    for (const document of documents) {
      push({
        id: `context-resource-${document.id}`,
        kind: 'documentation',
        label: document.title,
        source: document.origin,
        content: document.content,
      });
    }

    return { items: result, documents, truncated, characters };
  }
}
