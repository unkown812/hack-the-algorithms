import { describe, expect, it } from 'vitest';
import { DebuggerService } from '../../../src/core/debugging/DebuggerService';
import { GCCCompiler } from '../../../src/core/compiler/GCCCompiler';
import { detectCompiler } from '../../../src/core/compiler/CompilerDetector';
import { createWorkingDirectory, removeWorkingDirectory } from '../../../src/core/execution/ProcessManager';
import type { CompilerConfiguration } from '../../../src/core/playground/types';

const SOURCE = `#include <stdio.h>

int total(int n) {
    int sum = 0;
    for (int i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}

int main(void) {
    int arr[5] = {10, 20, 30, 40, 50};
    int result = total(3);
    printf("%d\\n", result);
    return 0;
}
`;

const CONFIG: CompilerConfiguration = {
  compilerPath: null,
  standard: 'c11',
  optimization: 'O0',
  warningLevel: 'basic',
  debugSymbols: true,
  extraArgs: [],
};

describe('debugger service', () => {
  const compiler = detectCompiler();
  const hasGcc = compiler.available && compiler.verified;
  const service = new DebuggerService();

  it('reports the debugger status of this machine', () => {
    const info = service.detect();

    expect(typeof info.available).toBe('boolean');
    if (info.available) {
      expect(info.executablePath).toBeTruthy();
      expect(info.capabilities).toContain('breakpoints');
      expect(info.capabilities).toContain('variables');
    } else {
      expect(info.unavailableReason).toBeTruthy();
      expect(info.installHint).toBeTruthy();
    }
  });

  it('runs a program, stops at a breakpoint and inspects the variables', async () => {
    if (!hasGcc) {
      return;
    }
    if (!service.detect().available) {
      return;
    }

    const directory = createWorkingDirectory('daa-test-debug-');
    const gcc = new GCCCompiler(compiler);
    const compiled = gcc.compile({
      source: SOURCE,
      configuration: CONFIG,
      outputDirectory: directory,
      fileName: 'program.c',
    });

    expect(compiled.success).toBe(true);

    await service.start({
      binaryPath: compiled.binaryPath!,
      workingDirectory: directory,
      sourceFileName: 'program.c',
      breakpoints: [14],
      timeoutMs: 20000,
    });

    const stop = await service.run();

    expect(stop.exited).toBe(false);
    expect(stop.line).toBe(14);
    expect(stop.functionName).toBe('main');

    const variableNames = stop.variables.map((variable) => variable.name);
    expect(variableNames).toContain('arr');
    expect(variableNames).toContain('result');

    const array = stop.variables.find((variable) => variable.name === 'arr');
    expect(array?.type).toMatch(/int/);
    expect(array?.value).toContain('10');

    expect(stop.callStack.length).toBeGreaterThan(0);
    expect(stop.callStack[0].functionName).toBe('main');

    await service.stop();
    removeWorkingDirectory(directory);
  }, 40000);

  it('reads a numeric array from the running program', async () => {
    if (!hasGcc) {
      return;
    }
    if (!service.detect().available) {
      return;
    }

    const directory = createWorkingDirectory('daa-test-debug-array-');
    const gcc = new GCCCompiler(compiler);
    const compiled = gcc.compile({
      source: SOURCE,
      configuration: CONFIG,
      outputDirectory: directory,
      fileName: 'program.c',
    });

    await service.start({
      binaryPath: compiled.binaryPath!,
      workingDirectory: directory,
      sourceFileName: 'program.c',
      breakpoints: [14],
      timeoutMs: 20000,
    });

    await service.run();
    const values = await service.readNumericArray('arr');

    expect(values).toEqual([10, 20, 30, 40, 50]);

    await service.stop();
    removeWorkingDirectory(directory);
  }, 40000);

  it('refuses to start without a compiled program', async () => {
    if (!hasGcc) {
      return;
    }
    if (!service.detect().available) {
      return;
    }

    await expect(
      service.start({
        binaryPath: 'no-such-binary',
        workingDirectory: '.',
        sourceFileName: 'program.c',
        breakpoints: [],
      })
    ).rejects.toThrow(/could not be found/i);
  });
});
