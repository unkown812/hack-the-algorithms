import { buildSourceMap, toVisualizationStep } from './SourceMapper';
import type { SourceMap } from './SourceMapper';
import type { DebugStop } from '../debugging/DebuggerService';
import type { ExecutionStep } from '../visualization/types';
import type { TraceEvent } from '../playground/types';

/**
 * Builds a real execution trace from a debug session.
 *
 * The trace contains only information the debugger actually reported:
 * the current source line, the variables of the current frame and the call
 * stack. Operation counters are derived from the source analysis and are
 * marked as unreliable when the source could not be mapped.
 */

export interface TracerOptions {
  /** Maximum number of trace events kept in memory. */
  maxEvents?: number;
}

export interface TraceSnapshot {
  events: TraceEvent[];
  steps: ExecutionStep[];
  counters: {
    comparisons: number;
    swaps: number;
    iterations: number;
    reliable: boolean;
    note: string;
  };
  sourceMap: SourceMap;
}

export class ExecutionTracer {
  private events: TraceEvent[] = [];
  private steps: ExecutionStep[] = [];
  private comparisons = 0;
  private swaps = 0;
  private iterations = 0;
  private sequence = 0;
  private readonly maxEvents: number;

  constructor(
    private readonly source: string,
    private readonly algorithmId: string | null,
    options: TracerOptions = {}
  ) {
    this.maxEvents = options.maxEvents ?? 500;
  }

  /** The source analysis used to classify the executed lines. */
  get sourceMap(): SourceMap {
    return buildSourceMap(this.source, this.algorithmId);
  }

  /**
   * Records one stop of the debugger and returns the resulting trace state.
   */
  record(stop: DebugStop, arrayValues?: number[]): TraceSnapshot {
    const map = buildSourceMap(this.source, this.algorithmId);
    const role = map.lines.get(stop.line) ?? 'other';

    // Counters are only advanced for lines whose role was recognised in the
    // source. Unknown lines never change a counter.
    switch (role) {
    case 'comparison':
      this.comparisons += 1;
      break;
    case 'swap':
      this.swaps += 1;
      break;
    case 'loop-iteration':
      this.iterations += 1;
      break;
    default:
      break;
    }

    const variables = stop.variables.map((variable) => ({
      name: variable.name,
      value: variable.value,
      type: variable.type,
    }));

    const event: TraceEvent = {
      id: this.sequence,
      sequence: this.sequence,
      type: role === 'comparison' ? 'condition' : role === 'swap' ? 'array-modified' : 'line',
      file: stop.file,
      line: stop.line,
      functionName: stop.functionName,
      description: describeStop(stop, role),
      variables: stop.variables,
      arrayValues,
      arrayName: map.arrayName ?? undefined,
      timestamp: Date.now(),
    };

    this.sequence += 1;
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    const step = toVisualizationStep({
      id: this.sequence,
      description: event.description,
      lineNumber: stop.line,
      variables: Object.fromEntries(variables.map((v) => [v.name, v.value])),
      arrayValues,
      comparisons: this.comparisons,
      swaps: this.swaps,
      iterations: this.iterations,
    });
    this.steps.push(step);
    if (this.steps.length > this.maxEvents) {
      this.steps.shift();
    }

    return this.snapshot(map);
  }

  /** The current trace state. */
  snapshot(map?: SourceMap): TraceSnapshot {
    const sourceMap = map ?? buildSourceMap(this.source, this.algorithmId);
    return {
      events: [...this.events],
      steps: [...this.steps],
      counters: {
        comparisons: this.comparisons,
        swaps: this.swaps,
        iterations: this.iterations,
        reliable: sourceMap.recognised,
        note: sourceMap.note,
      },
      sourceMap,
    };
  }

  /** Removes every recorded event. */
  reset(): void {
    this.events = [];
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.iterations = 0;
    this.sequence = 0;
  }
}

function describeStop(stop: DebugStop, role: string): string {
  if (stop.exited) {
    return 'The program finished.';
  }
  switch (role) {
  case 'comparison':
    return `Line ${stop.line}: the program compared two values.`;
  case 'swap':
    return `Line ${stop.line}: the program exchanged two values.`;
  case 'loop-iteration':
    return `Line ${stop.line}: the program entered a loop iteration.`;
  default:
    return `Line ${stop.line} is executing${stop.functionName ? ` in ${stop.functionName}()` : ''}.`;
  }
}
