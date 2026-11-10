import { describe, expect, it } from 'vitest';
import { PlaygroundService } from '../../../src/core/playground/PlaygroundService';
import type { ProgramStorage } from '../../../src/core/playground/PlaygroundService';
import { detectCompiler } from '../../../src/core/compiler/CompilerDetector';
import type {
  DebugSessionState,
  ExecutionConfig,
  TraceEvent,
} from '../../../src/core/playground/types';

const SOURCE = `#include <stdio.h>

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
    for (int i = 0; i < 5; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    return 0;
}
`;

const EXECUTION: ExecutionConfig = {
  language: 'c',
  standard: 'c11',
  optimization: 'O0',
  timeoutMs: 10000,
  maxOutputBytes: 64 * 1024,
  debugSymbols: true,
};

function createStorage(): ProgramStorage {
  return {
    async saveProgram() {
      return { filePath: 'program.c', updatedAt: Date.now() };
    },
    async loadProgram() {
      return null;
    },
    async getProgramPath() {
      return 'program.c';
    },
    async deleteProgram() {
      /* no-op */
    },
    async listPrograms() {
      return [];
    },
    async saveTestCases() {
      /* no-op */
    },
    async loadTestCases() {
      return [];
    },
    async recordHistory() {
      /* no-op */
    },
    async listHistory() {
      return [];
    },
    async clearHistory() {
      /* no-op */
    },
  };
}

describe('playground end-to-end', () => {
  const compiler = detectCompiler();
  const hasGcc = compiler.available && compiler.verified;
  const hasGdb = new PlaygroundService(createStorage()).getDebuggerInfo().available;

  it('compiles, runs and reports the sorted output', async () => {
    if (!hasGcc) {
      return;
    }

    const service = new PlaygroundService(createStorage());
    const result = await service.run(SOURCE, 'e2e', EXECUTION, '');

    expect(result.status).toBe('success');
    expect(result.stdout.trim()).toBe('1 2 3 5 8');
    expect(result.exitCode).toBe(0);
  }, 30000);

  it('debugs the program, steps through it and traces the execution', async () => {
    if (!hasGcc || !hasGdb) {
      return;
    }

    const states: DebugSessionState[] = [];
    const events: TraceEvent[] = [];

    const service = new PlaygroundService(createStorage(), {
      onStatus: (state) => states.push(state),
      onTraceEvent: (event) => events.push(event),
    });

    // Breakpoint on the comparison inside bubbleSort (line 7).
    const state = await service.startDebugging(SOURCE, 'bubble-sort', [7], EXECUTION);

    expect(state.status).toBe('paused');
    expect(state.currentLine).toBe(7);
    expect(state.currentFunction).toBe('bubbleSort');
    expect(state.variables.length).toBeGreaterThan(0);
    expect(state.callStack.length).toBeGreaterThan(0);

    const variableNames = state.variables.map((variable) => variable.name);
    expect(variableNames).toContain('arr');
    expect(variableNames).toContain('i');
    expect(variableNames).toContain('j');

    // The array of the running program is read from the debugger.
    const arrayVariable = state.variables.find((variable) => variable.name === 'arr');
    expect(arrayVariable?.value).toContain('5');

    // Step over the comparison and continue.
    const stepped = await service.stepDebugging('over');
    expect(stepped.status).toBe('paused');
    expect(stepped.currentLine).toBeGreaterThan(0);

    const continued = await service.stepDebugging('continue');
    expect(['paused', 'stopped']).toContain(continued.status);

    // The trace recorded the executed lines and the derived counters.
    expect(states.length).toBeGreaterThan(0);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].line).toBe(7);
    expect(state.counters.reliable).toBe(true);
    expect(state.counters.comparisons).toBeGreaterThan(0);

    await service.stopDebugging();
    expect(service.getDebugState().status).toBe('idle');
  }, 60000);
});
