import type { AIContextKind } from '../../core/ai/types';
import type { ExecutionStep } from '../../core/visualization/types';

/**
 * The registry of the learning context.
 *
 * The pages of the extension publish what the student is currently looking
 * at — the selected algorithm, the current step of the visualization, the
 * last compiler result, the complexity analysis. The assistant reads the
 * registry and offers the items that fit the question.
 *
 * Two rules keep this safe:
 *
 * 1. **Publishing is not sharing.** An item that is published is only
 *    *available*; the student has to attach it explicitly before it is sent.
 * 2. The registry never reads a file on its own — a page publishes only what
 *    it already shows.
 */
export interface PublishedContext {
  /** A stable id, unique per origin. */
  id: string;
  kind: AIContextKind;
  /** The label that is shown in the context panel. */
  label: string;
  /** The text that would be sent. */
  content: string;
  /** Where the item comes from, e.g. "Visualization engine". */
  source?: string;
  /** The page that published the item. */
  origin: string;
  updatedAt: number;
}

type Listener = (items: PublishedContext[]) => void;

class AIContextRegistry {
  private readonly items = new Map<string, PublishedContext>();
  private readonly listeners = new Set<Listener>();

  /** Publishes an item — it becomes available, not shared. */
  publish(item: Omit<PublishedContext, 'updatedAt'>): void {
    this.items.set(item.id, { ...item, updatedAt: Date.now() });
    this.notify();
  }

  /** Removes every item of a page — for example when the student leaves it. */
  clear(origin: string): void {
    let changed = false;
    for (const [id, item] of this.items) {
      if (item.origin === origin) {
        this.items.delete(id);
        changed = true;
      }
    }
    if (changed) {
      this.notify();
    }
  }

  /** All available items, newest first. */
  list(): PublishedContext[] {
    return [...this.items.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /** Subscribes to the changes of the registry. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const items = this.list();
    for (const listener of this.listeners) {
      listener(items);
    }
  }
}

/** The singleton of the webview. */
export const aiContextRegistry = new AIContextRegistry();

/**
 * Builds the context item of a visualization step.
 *
 * The text describes exactly what the trace contains — the array, the
 * compared and exchanged elements, the variables and the counters. The
 * assistant interprets this text, it never reconstructs a state of its own.
 */
export function visualizationContextItem(
  algorithmId: string,
  algorithmName: string,
  step: ExecutionStep,
  stepIndex: number,
  totalSteps: number
): Omit<PublishedContext, 'updatedAt'> {
  const values = step.currentState.array?.values ?? [];
  const variables = { ...step.currentState.variables, ...(step.variables ?? {}) };

  const content = [
    `Algorithm: ${algorithmName} (${algorithmId})`,
    `Current step: ${stepIndex + 1} of ${totalSteps}`,
    `Operation: ${step.operation}`,
    `Description: ${step.description}`,
    step.lineNumber ? `Source line: ${step.lineNumber}` : '',
    '',
    `Explanation: ${step.explanation}`,
    values.length > 0 ? `Array: [${values.join(', ')}]` : '',
    step.comparedElements?.length
      ? `Compared elements: ${step.comparedElements
        .map((index) => `${index} (${values[index] ?? '?'})`)
        .join(' and ')}`
      : '',
    step.swappedElements?.length
      ? `Exchanged elements: ${step.swappedElements.join(', ')}`
      : '',
    Object.keys(variables).length > 0
      ? `Variables: ${Object.entries(variables)
        .map(([name, value]) => `${name} = ${String(value)}`)
        .join(', ')}`
      : '',
    `Counters: operations ${step.complexity.operations}, comparisons ${step.complexity.comparisons}, swaps ${step.complexity.swaps}, iterations ${step.complexity.iterations}`,
  ]
    .filter((line) => line !== '')
    .join('\n');

  return {
    id: `visualization-${algorithmId}`,
    kind: 'visualization',
    label: `Visualization step — ${algorithmName} (step ${stepIndex + 1})`,
    content,
    source: 'Visualization engine',
    origin: 'visualizer',
  };
}
