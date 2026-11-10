import { describe, expect, it } from 'vitest';
import { PROGRAM_TEMPLATES, getTemplate } from '../../../src/core/playground/templates';
import {
  getReferenceImplementation,
  getReferenceAlgorithmIds,
} from '../../../src/core/playground/referenceImplementations';
import { getAllAlgorithms } from '../../../src/core/algorithms';
import { detectCompiler } from '../../../src/core/compiler/CompilerDetector';
import { GCCCompiler } from '../../../src/core/compiler/GCCCompiler';
import { PlaygroundService, DEFAULT_COMPILER_CONFIGURATION } from '../../../src/core/playground/PlaygroundService';
import type { ProgramStorage } from '../../../src/core/playground/PlaygroundService';
import type { ExecutionConfig, TestCase } from '../../../src/core/playground/types';

describe('starter templates', () => {
  it('offers every template of the phase specification', () => {
    const ids = PROGRAM_TEMPLATES.map((template) => template.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'basic',
        'array-io',
        'searching',
        'sorting',
        'recursive',
        'graph',
        'dynamic-programming',
        'empty',
      ])
    );
  });

  it('describes every template and provides compilable source', () => {
    for (const template of PROGRAM_TEMPLATES) {
      expect(template.name.length).toBeGreaterThan(0);
      expect(template.description.length).toBeGreaterThan(0);
      expect(template.source).toContain('#include <stdio.h>');
      expect(template.source).toContain('int main');
    }
  });

  it('finds a template by id', () => {
    expect(getTemplate('sorting')?.algorithmId).toBe('bubble-sort');
    expect(getTemplate('unknown')).toBeUndefined();
  });

  it('compiles every template', () => {
    const compiler = detectCompiler();
    if (!compiler.available || !compiler.verified) {
      return;
    }

    const gcc = new GCCCompiler(compiler);
    for (const template of PROGRAM_TEMPLATES) {
      const outcome = gcc.compile({ source: template.source, configuration: DEFAULT_COMPILER_CONFIGURATION });
      const errors = outcome.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
      expect(errors.map((error) => error.message), `template ${template.id}`).toEqual([]);
      expect(outcome.success, `template ${template.id}`).toBe(true);
    }
  });
});

describe('reference implementations', () => {
  it('covers every algorithm of the registry', () => {
    const ids = getReferenceAlgorithmIds();
    for (const algorithm of getAllAlgorithms()) {
      expect(ids).toContain(algorithm.id);
    }
  });

  it('returns the reviewed code, pseudocode and complexity', () => {
    const reference = getReferenceImplementation('bubble-sort');

    expect(reference).not.toBeNull();
    expect(reference?.sourceCode).toContain('void bubbleSort');
    expect(reference?.pseudocode.length).toBeGreaterThan(0);
    expect(reference?.timeComplexity.worst).toBeTruthy();
    expect(reference?.logicBlocks.length).toBeGreaterThan(0);
  });

  it('returns null for an unknown algorithm', () => {
    expect(getReferenceImplementation('does-not-exist')).toBeNull();
  });
});

describe('playground service', () => {
  const compiler = detectCompiler();
  const hasGcc = compiler.available && compiler.verified;

  const EXECUTION: ExecutionConfig = {
    language: 'c',
    standard: 'c11',
    optimization: 'O0',
    timeoutMs: 5000,
    maxOutputBytes: 64 * 1024,
    debugSymbols: true,
  };

  function createStorage(): ProgramStorage & { history: unknown[] } {
    const history: unknown[] = [];
    return {
      history,
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
      async recordHistory(entry) {
        history.push(entry);
      },
      async listHistory() {
        return history as never;
      },
      async clearHistory() {
        history.length = 0;
      },
    };
  }

  it('exposes the compiler status and the default configuration', () => {
    const service = new PlaygroundService(createStorage());

    expect(service.getCompilerInfo().id).toBe('gcc');
    expect(service.getConfiguration().standard).toBe('c11');
    expect(service.getConfiguration().optimization).toBe('O0');
    expect(service.getConfiguration().debugSymbols).toBe(true);
  });

  it('reports the debugger status', () => {
    const service = new PlaygroundService(createStorage());
    expect(typeof service.getDebuggerInfo().available).toBe('boolean');
  });

  it('runs a program and records the run in the history', async () => {
    if (!hasGcc) {
      return;
    }

    const storage = createStorage();
    const service = new PlaygroundService(storage);

    const result = await service.run(
      '#include <stdio.h>\nint main(void){printf("hi\\n");return 0;}\n',
      'demo',
      EXECUTION,
      ''
    );

    expect(result.status).toBe('success');
    expect(result.stdout.trim()).toBe('hi');
    expect(storage.history).toHaveLength(1);
  });

  it('reports a compilation error without running the program', async () => {
    if (!hasGcc) {
      return;
    }

    const service = new PlaygroundService(createStorage());
    const result = await service.run('int main(void){ broken }', 'demo', EXECUTION, '');

    expect(result.status).toBe('compile-error');
    expect(result.stdout).toBe('');
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it('runs the test cases of a program', async () => {
    if (!hasGcc) {
      return;
    }

    const service = new PlaygroundService(createStorage());
    const testCases: TestCase[] = [
      {
        id: 't1',
        name: 'prints hello',
        input: '',
        expectedOutput: 'hello\n',
        comparisonMode: 'normalized',
      },
    ];

    const summary = await service.runTests(
      '#include <stdio.h>\nint main(void){printf("hello\\n");return 0;}\n',
      testCases,
      EXECUTION
    );

    expect(summary.total).toBe(1);
    expect(summary.passed).toBe(1);
  });

  it('starts in an idle debug state', () => {
    const service = new PlaygroundService(createStorage());
    const state = service.getDebugState();

    expect(state.status).toBe('idle');
    expect(state.variables).toEqual([]);
    expect(state.counters.reliable).toBe(false);
  });
});
