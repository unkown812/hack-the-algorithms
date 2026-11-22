import { describe, expect, it } from 'vitest';
import {
  compareOutputs,
  normalizeWhitespace,
  parseNumericToken,
  buildDiff,
} from '../../../src/core/testing/OutputComparator';
import { TestCaseRegistry, validateTestCase } from '../../../src/core/testing/TestCaseRegistry';
import { TestRunner } from '../../../src/core/testing/TestRunner';
import { ExecutionService } from '../../../src/core/execution/ExecutionService';
import { GCCCompiler } from '../../../src/core/compiler/GCCCompiler';
import { detectCompiler } from '../../../src/core/compiler/CompilerDetector';
import type { CompilerConfiguration, ExecutionConfig, TestCase } from '../../../src/core/playground/types';

describe('output comparison', () => {
  it('compares exactly', () => {
    expect(compareOutputs('1 2 3\n', '1 2 3\n', 'exact').passed).toBe(true);
    expect(compareOutputs('1 2 3\n', '1 2 3', 'exact').passed).toBe(false);
  });

  it('ignores whitespace differences in the normalised mode', () => {
    const result = compareOutputs('1  2   3\n', '1 2 3', 'normalized');
    expect(result.passed).toBe(true);
    expect(result.detail).toMatch(/whitespace/i);
  });

  it('keeps meaningful differences in the normalised mode', () => {
    expect(compareOutputs('1 2 3', '1 2 4', 'normalized').passed).toBe(false);
  });

  it('compares numbers with a tolerance', () => {
    expect(compareOutputs('3.14159', '3.14159', 'numeric').passed).toBe(true);
    expect(compareOutputs('3.14', '3.15', 'numeric', 0.02).passed).toBe(true);
    expect(compareOutputs('3.14', '3.15', 'numeric', 0.001).passed).toBe(false);
  });

  it('reports a different number of values', () => {
    const result = compareOutputs('1 2', '1 2 3', 'numeric');
    expect(result.passed).toBe(false);
    expect(result.detail).toMatch(/Expected 3 values/);
  });

  it('normalises whitespace', () => {
    expect(normalizeWhitespace('  a \n b\t c  ')).toBe('a b c');
  });

  it('parses numeric tokens', () => {
    expect(parseNumericToken('42')).toBe(42);
    expect(parseNumericToken('-3.5')).toBe(-3.5);
    expect(parseNumericToken('1e3')).toBe(1000);
    expect(parseNumericToken('abc')).toBeNull();
  });

  it('builds a readable diff', () => {
    const diff = buildDiff('1\n2', '1\n3');
    expect(diff[0]).toContain('line 2');
  });
});

describe('test case registry', () => {
  it('adds, updates and removes test cases', () => {
    const registry = new TestCaseRegistry();
    const created = registry.add({ name: 'Sorted input', input: '5\n', expectedOutput: 'ok\n', comparisonMode: 'exact' });

    expect(created.id).toBeTruthy();
    expect(registry.size).toBe(1);
    expect(registry.get(created.id)?.name).toBe('Sorted input');

    const updated = registry.update(created.id, { name: 'Renamed' });
    expect(updated?.name).toBe('Renamed');

    expect(registry.delete(created.id)).toBe(true);
    expect(registry.size).toBe(0);
  });

  it('rejects invalid test cases', () => {
    const registry = new TestCaseRegistry();
    expect(() => registry.add({ name: '  ', input: '', expectedOutput: '', comparisonMode: 'exact' })).toThrow();
    expect(validateTestCase({ comparisonMode: 'unknown' as never }).valid).toBe(false);
    expect(validateTestCase({ numericTolerance: -1 }).valid).toBe(false);
    expect(validateTestCase({ name: 'ok', comparisonMode: 'exact' }).valid).toBe(true);
  });
});

describe('test runner', () => {
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

  const SOURCE = `#include <stdio.h>

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
`;

  const cases: TestCase[] = [
    { id: 't1', name: 'sum of three', input: '3\n10 20 30\n', expectedOutput: '60\n', comparisonMode: 'normalized' },
    { id: 't2', name: 'wrong expectation', input: '2\n1 2\n', expectedOutput: '99\n', comparisonMode: 'normalized' },
  ];

  it('runs every test case and reports the failures', async () => {
    if (!hasGcc) {
      return;
    }

    const runner = new TestRunner(new ExecutionService(new GCCCompiler(compiler)));
    const summary = await runner.runAll(SOURCE, CONFIG, cases, EXECUTION);

    expect(summary.total).toBe(2);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(1);

    const failure = summary.results.find((result) => result.status === 'failed');
    expect(failure?.name).toBe('wrong expectation');
    expect(failure?.actualOutput.trim()).toBe('3');
    expect(failure?.detail).toBeTruthy();
  });

  it('reports a compilation error for every test', async () => {
    if (!hasGcc) {
      return;
    }

    const runner = new TestRunner(new ExecutionService(new GCCCompiler(compiler)));
    const summary = await runner.runAll('int main(void){ broken }', CONFIG, cases, EXECUTION);

    expect(summary.passed).toBe(0);
    expect(summary.errored).toBe(2);
    expect(summary.results.every((result) => result.status === 'compile-error')).toBe(true);
  });

  it('handles an empty test list', async () => {
    const runner = new TestRunner(new ExecutionService(new GCCCompiler(compiler)));
    const summary = await runner.runAll(SOURCE, CONFIG, [], EXECUTION);

    expect(summary.total).toBe(0);
    expect(summary.results).toEqual([]);
  });
});
