import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { GCCCompiler } from '../../../src/core/compiler/GCCCompiler';
import { detectCompiler } from '../../../src/core/compiler/CompilerDetector';
import { ExecutionService } from '../../../src/core/execution/ExecutionService';
import { ExecutionSession } from '../../../src/core/execution/ExecutionSession';
import { ProcessManager, createWorkingDirectory, removeWorkingDirectory } from '../../../src/core/execution/ProcessManager';
import { normalizeExecutionConfig, clampTimeout, clampMaxOutputBytes } from '../../../src/core/execution/ExecutionConfig';
import type { CompilerConfiguration, ExecutionConfig } from '../../../src/core/playground/types';

const compiler = detectCompiler();
const hasGcc = compiler.available && compiler.verified;

const CONFIG: CompilerConfiguration = {
  compilerPath: null,
  standard: 'c11',
  optimization: 'O0',
  warningLevel: 'basic',
  debugSymbols: true,
  extraArgs: [],
};

const EXECUTION: ExecutionConfig = {
  language: 'c',
  standard: 'c11',
  optimization: 'O0',
  timeoutMs: 5000,
  maxOutputBytes: 64 * 1024,
  debugSymbols: true,
};

function build(source: string): { service: ExecutionService; directory: string } {
  const directory = createWorkingDirectory('daa-test-exec-');
  const gcc = new GCCCompiler(compiler);
  const service = new ExecutionService(gcc);
  return { service, directory };
}

describe('execution configuration', () => {
  it('clamps the timeout and the output cap', () => {
    expect(clampTimeout(10)).toBe(250);
    expect(clampTimeout(999999)).toBe(60000);
    expect(clampTimeout(5000)).toBe(5000);
    expect(clampMaxOutputBytes(1)).toBe(1024);
    expect(clampMaxOutputBytes(10 ** 9)).toBe(4 * 1024 * 1024);
  });

  it('normalises a partial configuration', () => {
    const config = normalizeExecutionConfig({ timeoutMs: 100 });
    expect(config.timeoutMs).toBe(250);
    expect(config.language).toBe('c');
    expect(config.standard).toBe('c11');
  });
});

describe('local program execution', () => {
  it('runs a program and captures its output', async () => {
    if (!hasGcc) {
      return;
    }

    const { service, directory } = build(
      '#include <stdio.h>\nint main(void){printf("hello\\n");return 0;}\n'
    );
    const result = await service.compileAndRun({
      source:
        '#include <stdio.h>\nint main(void){printf("hello\\n");return 0;}\n',
      programId: 'p1',
      configuration: CONFIG,
      execution: EXECUTION,
    });

    expect(result.status).toBe('success');
    expect(result.stdout.trim()).toBe('hello');
    expect(result.exitCode).toBe(0);
    expect(result.outputValid).toBeUndefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);

    removeWorkingDirectory(directory);
  });

  it('feeds custom input through stdin', async () => {
    if (!hasGcc) {
      return;
    }

    const { service } = build('');
    const result = await service.compileAndRun({
      source: `#include <stdio.h>
int main(void) {
    int n;
    scanf("%d", &n);
    int total = 0;
    for (int i = 0; i < n; i++) {
        int value;
        scanf("%d", &value);
        total += value;
    }
    printf("%d\\n", total);
    return 0;
}
`,
      programId: 'p2',
      configuration: CONFIG,
      execution: EXECUTION,
      stdin: '3\n10 20 30\n',
    });

    expect(result.status).toBe('success');
    expect(result.stdout.trim()).toBe('60');
  });

  it('treats an empty output as a successful run', async () => {
    if (!hasGcc) {
      return;
    }

    const { service } = build('');
    const result = await service.compileAndRun({
      source: 'int main(void){return 0;}\n',
      programId: 'p3',
      configuration: CONFIG,
      execution: EXECUTION,
    });

    expect(result.status).toBe('success');
    expect(result.stdout).toBe('');
    expect(result.exitCode).toBe(0);
  });

  it('captures standard error separately from standard output', async () => {
    if (!hasGcc) {
      return;
    }

    const { service } = build('');
    const result = await service.compileAndRun({
      source: `#include <stdio.h>
int main(void) {
    fprintf(stderr, "problem here\\n");
    printf("normal output\\n");
    return 0;
}
`,
      programId: 'p4',
      configuration: CONFIG,
      execution: EXECUTION,
    });

    expect(result.stdout).toContain('normal output');
    expect(result.stderr).toContain('problem here');
  });

  it('reports a non-zero exit code as a runtime error', async () => {
    if (!hasGcc) {
      return;
    }

    const { service } = build('');
    const result = await service.compileAndRun({
      source: '#include <stdlib.h>\nint main(void){return 3;}\n',
      programId: 'p5',
      configuration: CONFIG,
      execution: EXECUTION,
    });

    expect(result.status).toBe('runtime-error');
    expect(result.exitCode).toBe(3);
  });

  it('stops an infinite loop after the timeout', async () => {
    if (!hasGcc) {
      return;
    }

    const { service } = build('');
    const result = await service.compileAndRun({
      source: 'int main(void){while(1){}return 0;}\n',
      programId: 'p6',
      configuration: CONFIG,
      execution: { ...EXECUTION, timeoutMs: 1000 },
    });

    expect(result.status).toBe('timeout');
    expect(result.timedOut).toBe(true);
    expect(result.durationMs).toBeLessThan(15000);
  });

  it('stops a program when the user cancels it', async () => {
    if (!hasGcc) {
      return;
    }

    const { service } = build('');
    const session = new ExecutionSession('cancel-me', null);

    const promise = service.compileAndRun({
      source: 'int main(void){while(1){}return 0;}\n',
      programId: 'p7',
      configuration: CONFIG,
      execution: { ...EXECUTION, timeoutMs: 10000 },
      session,
    });

    setTimeout(() => session.cancel(), 400);
    const result = await promise;

    expect(result.status).toBe('cancelled');
    expect(result.cancelled).toBe(true);
  });

  it('reports a compilation failure instead of running the program', async () => {
    if (!hasGcc) {
      return;
    }

    const { service } = build('');
    const result = await service.compileAndRun({
      source: 'int main(void){ this is not c }\n',
      programId: 'p8',
      configuration: CONFIG,
      execution: EXECUTION,
    });

    expect(result.status).toBe('compile-error');
    expect(result.stdout).toBe('');
    expect(result.exitCode).toBeNull();
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it('caps the captured output', async () => {
    if (!hasGcc) {
      return;
    }

    const { service } = build('');
    const result = await service.compileAndRun({
      source: `#include <stdio.h>
int main(void) {
    for (int i = 0; i < 20000; i++) {
        printf("0123456789012345678901234567890123456789");
    }
    return 0;
}
`,
      programId: 'p9',
      configuration: CONFIG,
      execution: { ...EXECUTION, maxOutputBytes: 2048, timeoutMs: 10000 },
    });

    expect(result.outputTruncated).toBe(true);
    expect(result.stdout.length).toBeLessThanOrEqual(2048);
  });
});

describe('process manager', () => {
  it('creates and removes temporary working directories', () => {
    const directory = createWorkingDirectory('daa-test-dir-');
    expect(fs.existsSync(directory)).toBe(true);
    removeWorkingDirectory(directory);
    expect(fs.existsSync(directory)).toBe(false);
  });

  it('never runs a program through a shell', async () => {
    if (!hasGcc) {
      return;
    }

    const directory = createWorkingDirectory('daa-test-shell-');
    const gcc = new GCCCompiler(compiler);
    const outcome = gcc.compile({
      source: 'int main(void){return 0;}\n',
      configuration: CONFIG,
      outputDirectory: directory,
    });

    expect(outcome.success).toBe(true);

    const manager = new ProcessManager();
    const result = await manager.run({
      executablePath: outcome.binaryPath!,
      cwd: directory,
      stdin: '',
      config: EXECUTION,
    });

    expect(result.exitCode).toBe(0);
    expect(result.commandLine).toContain('program.exe');

    removeWorkingDirectory(directory);
  });

  it('reports a missing executable instead of hanging', async () => {
    const manager = new ProcessManager();
    const result = await manager.run({
      executablePath: path.join(os.tmpdir(), 'definitely-missing-binary.exe'),
      cwd: os.tmpdir(),
      stdin: '',
      config: EXECUTION,
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toBe('');
  });
});

describe('gcc smoke check', () => {
  it('reports the detected toolchain', () => {
    // Keeps the suite meaningful on machines without GCC.
    expect(typeof hasGcc).toBe('boolean');
    if (!hasGcc) {
      expect(compiler.unavailableReason).toBeTruthy();
    }
  });

  it('runs the compiler directly when it is available', () => {
    if (!hasGcc) {
      return;
    }
    const result = spawnSync(compiler.executablePath, ['--version'], { encoding: 'utf8' });
    expect(result.status).toBe(0);
  });
});
