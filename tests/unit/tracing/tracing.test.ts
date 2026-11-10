import { describe, expect, it } from 'vitest';
import {
  buildSourceMap,
  stripCommentsAndStrings,
  toVisualizationStep,
} from '../../../src/core/tracing/SourceMapper';
import { ExecutionTracer } from '../../../src/core/tracing/ExecutionTracer';
import type { DebugStop } from '../../../src/core/debugging/DebuggerService';

const BUBBLE_SOURCE = `#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = 1;
            }
        }
        if (!swapped) {
            break;
        }
    }
}

int main(void) {
    int arr[5] = {5, 3, 8, 2, 1};
    bubbleSort(arr, 5);
    return 0;
}
`;

describe('source mapper', () => {
  it('removes comments and strings before matching', () => {
    expect(stripCommentsAndStrings('int a; // arr[j] > arr[j+1]')).toBe('int a; ');
    expect(stripCommentsAndStrings('printf("arr[j] > x");')).toBe('printf();');
    expect(stripCommentsAndStrings('/* arr[j] > 0 */ int b;')).toBe(' int b;');
  });

  it('recognises the comparison and exchange lines of bubble sort', () => {
    const map = buildSourceMap(BUBBLE_SOURCE, 'bubble-sort');

    expect(map.recognised).toBe(true);
    // The comparison is the `if` statement.
    expect(map.lines.get(7)).toBe('comparison');
    // The exchange spans three statements but counts as one exchange.
    expect(map.lines.get(8)).toBe('swap');
    expect(map.lines.get(9)).toBeUndefined();
    expect(map.lines.get(10)).toBeUndefined();
    // Only the innermost loop drives the iteration counter.
    expect(map.lines.get(6)).toBe('loop-iteration');
    expect(map.lines.get(4)).toBeUndefined();
    expect(map.arrayName).toBe('arr');
  });

  it('does not recognise statements inside comments', () => {
    const source = `int main(void) {\n    // if (arr[j] > arr[j + 1]) { int temp = arr[j]; }\n    return 0;\n}\n`;
    const map = buildSourceMap(source, 'bubble-sort');

    expect(map.lines.get(2)).toBeUndefined();
    expect(map.recognised).toBe(false);
  });

  it('reports that the counters are unavailable when the source does not match', () => {
    const map = buildSourceMap('int main(void){ return 0; }\n', 'bubble-sort');

    expect(map.recognised).toBe(false);
    expect(map.note).toMatch(/cannot be derived|does not contain/i);
  });

  it('explains that plain source tracing is available without an algorithm', () => {
    const map = buildSourceMap('int main(void){ return 0; }\n', null);
    expect(map.note).toMatch(/source-line/i);
  });

  it('converts a trace step into the Phase 2 execution step shape', () => {
    const step = toVisualizationStep({
      id: 3,
      description: 'compare',
      lineNumber: 7,
      variables: { j: 2 },
      arrayValues: [5, 3, 8],
      comparedIndices: [1, 2],
      comparisons: 4,
      swaps: 1,
      iterations: 3,
    });

    expect(step.lineNumber).toBe(7);
    expect(step.comparedElements).toEqual([1, 2]);
    expect(step.currentState.array?.values).toEqual([5, 3, 8]);
    expect(step.complexity.comparisons).toBe(4);
    expect(step.complexity.operations).toBe(8);
  });
});

describe('execution tracer', () => {
  const stop = (line: number): DebugStop => ({
    reason: 'breakpoint-hit',
    file: 'program.c',
    line,
    functionName: 'bubbleSort',
    output: '',
    exited: false,
    variables: [],
    callStack: [],
  });

  it('records one event per stop and keeps the order', () => {
    const tracer = new ExecutionTracer(BUBBLE_SOURCE, 'bubble-sort');
    tracer.record(stop(7));
    tracer.record(stop(9));
    const snapshot = tracer.record(stop(5));

    expect(snapshot.events).toHaveLength(3);
    expect(snapshot.events.map((event) => event.sequence)).toEqual([0, 1, 2]);
    expect(snapshot.events[0].line).toBe(7);
    expect(snapshot.events[1].line).toBe(9);
  });

  it('counts comparisons and exchanges only for recognised lines', () => {
    const tracer = new ExecutionTracer(BUBBLE_SOURCE, 'bubble-sort');
    tracer.record(stop(7)); // comparison
    tracer.record(stop(8)); // exchange (first statement of the block)
    tracer.record(stop(10)); // still part of the same exchange block
    tracer.record(stop(3)); // unknown line
    const snapshot = tracer.snapshot();

    expect(snapshot.counters.comparisons).toBe(1);
    expect(snapshot.counters.swaps).toBe(1);
    expect(snapshot.counters.reliable).toBe(true);
  });

  it('marks the counters as unreliable when the source is unknown', () => {
    const tracer = new ExecutionTracer('int main(void){return 0;}', 'bubble-sort');
    const snapshot = tracer.record(stop(2));

    expect(snapshot.counters.reliable).toBe(false);
    expect(snapshot.counters.comparisons).toBe(0);
    expect(snapshot.counters.note).toBeTruthy();
  });

  it('limits the number of stored events', () => {
    const tracer = new ExecutionTracer(BUBBLE_SOURCE, 'bubble-sort', { maxEvents: 5 });
    for (let i = 0; i < 12; i++) {
      tracer.record(stop(7));
    }

    expect(tracer.snapshot().events).toHaveLength(5);
  });

  it('resets the recorded state', () => {
    const tracer = new ExecutionTracer(BUBBLE_SOURCE, 'bubble-sort');
    tracer.record(stop(7));
    tracer.reset();

    const snapshot = tracer.snapshot();
    expect(snapshot.events).toHaveLength(0);
    expect(snapshot.counters.comparisons).toBe(0);
  });

  it('produces Phase 2 compatible steps', () => {
    const tracer = new ExecutionTracer(BUBBLE_SOURCE, 'bubble-sort');
    const snapshot = tracer.record(stop(7));

    expect(snapshot.steps).toHaveLength(1);
    expect(snapshot.steps[0].lineNumber).toBe(7);
    expect(snapshot.steps[0].currentState.status).toBe('running');
  });
});
