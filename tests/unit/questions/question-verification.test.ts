import { describe, expect, it } from 'vitest';
import { detectCompiler } from '../../../src/core/compiler/CompilerDetector';
import { GCCCompiler } from '../../../src/core/compiler/GCCCompiler';
import { ExecutionService } from '../../../src/core/execution/ExecutionService';
import { createWorkingDirectory, removeWorkingDirectory } from '../../../src/core/execution/ProcessManager';
import { normalizeExecutionConfig } from '../../../src/core/execution/ExecutionConfig';
import { normalizeOutput } from '../../../src/core/questions/AnswerEvaluator';
import { ALL_QUESTIONS } from '../../../src/core/questions/QuestionRegistry';
import type { Question } from '../../../src/core/practice/types';

const compiler = detectCompiler();
const hasGcc = compiler.available && compiler.verified;

const EXECUTION = normalizeExecutionConfig({
  language: 'c',
  standard: 'c11',
  optimization: 'O0',
  timeoutMs: 10000,
  maxOutputBytes: 64 * 1024,
  debugSymbols: true,
});

const codeQuestions = ALL_QUESTIONS.filter(
  (question) => question.type === 'code-output' && question.code
);

describe('code output questions', () => {
  it('ships code output exercises', () => {
    expect(codeQuestions.length).toBeGreaterThanOrEqual(5);
  });

  it('produces exactly the stated output for every code snippet', async () => {
    if (!hasGcc) {
      return;
    }

    const service = new ExecutionService(new GCCCompiler(compiler));
    const failures: string[] = [];

    for (const question of codeQuestions) {
      const directory = createWorkingDirectory('daa-codequestion-');
      const compiled = service.compile(question.code!, {
        compilerPath: null,
        standard: 'c11',
        optimization: 'O0',
        warningLevel: 'basic',
        debugSymbols: true,
        extraArgs: [],
      }, directory, 'question.c');

      if (!compiled.success || !compiled.binaryPath) {
        failures.push(
          `${question.id}: the snippet did not compile — ${compiled.diagnostics
            .filter((d) => d.severity === 'error')
            .map((d) => d.message)
            .join('; ')}`
        );
        removeWorkingDirectory(directory);
        continue;
      }

      const result = await service.runBinary(compiled.binaryPath, {
        programId: question.id,
        execution: EXECUTION,
        stdin: '',
        cwd: directory,
      });

      const expected = normalizeOutput(
        Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : question.correctAnswer
      );
      const actual = normalizeOutput(result.stdout);

      if (actual !== expected) {
        failures.push(
          `${question.id}: expected ${JSON.stringify(expected)} but the program printed ${JSON.stringify(actual)}`
        );
      }

      removeWorkingDirectory(directory);
    }

    expect(failures).toEqual([]);
  }, 300000);
});

describe('find the error questions', () => {
  const findErrorQuestions = ALL_QUESTIONS.filter((question) => question.type === 'find-error');

  it('ships find-the-error exercises with a marked line and a correction', () => {
    expect(findErrorQuestions.length).toBeGreaterThanOrEqual(4);

    for (const question of findErrorQuestions) {
      expect(question.code?.length ?? 0).toBeGreaterThan(20);
      expect(question.errorLines?.length ?? 0).toBeGreaterThan(0);
      expect(question.correctedCode?.length ?? 0).toBeGreaterThan(20);

      const lines = (question.code ?? '').split('\n');
      for (const line of question.errorLines ?? []) {
        expect(line).toBeGreaterThan(0);
        expect(line).toBeLessThanOrEqual(lines.length);
      }
    }
  });

  it('compiles the corrected version of every exercise', async () => {
    if (!hasGcc) {
      return;
    }

    const service = new ExecutionService(new GCCCompiler(compiler));
    const failures: string[] = [];

    for (const question of findErrorQuestions) {
      const directory = createWorkingDirectory('daa-finderror-');
      const compiled = service.compile(question.correctedCode!, {
        compilerPath: null,
        standard: 'c11',
        optimization: 'O0',
        warningLevel: 'basic',
        debugSymbols: true,
        extraArgs: [],
      }, directory, 'corrected.c');

      if (!compiled.success) {
        failures.push(
          `${question.id}: the corrected code did not compile — ${compiled.diagnostics
            .filter((d) => d.severity === 'error')
            .map((d) => d.message)
            .join('; ')}`
        );
      }

      removeWorkingDirectory(directory);
    }

    expect(failures).toEqual([]);
  }, 300000);

  it('shows the error on the line the question marks', () => {
    for (const question of findErrorQuestions) {
      const lines = (question.code ?? '').split('\n');
      const marked = (question.errorLines ?? []).map((line) => lines[line - 1] ?? '');
      expect(marked.join('')).not.toBe('');
    }
  });
});

describe('complexity questions', () => {
  it('ships complexity exercises with an explanation', () => {
    const complexityQuestions = ALL_QUESTIONS.filter((question) => question.type === 'complexity');
    expect(complexityQuestions.length).toBeGreaterThanOrEqual(4);

    for (const question of complexityQuestions) {
      expect(question.options?.length ?? 0).toBeGreaterThanOrEqual(2);
      expect(question.explanation.length).toBeGreaterThan(30);
    }
  });
});
