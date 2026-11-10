import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { detectCompiler } from '../../../src/core/compiler/CompilerDetector';
import { GCCCompiler } from '../../../src/core/compiler/GCCCompiler';
import { ExecutionService } from '../../../src/core/execution/ExecutionService';
import { createWorkingDirectory, removeWorkingDirectory } from '../../../src/core/execution/ProcessManager';
import { normalizeExecutionConfig } from '../../../src/core/execution/ExecutionConfig';
import { CODING_CHALLENGES } from '../../../src/core/challenges/challenges';
import type { ChallengeTestCase } from '../../../src/core/practice/types';

const compiler = detectCompiler();
const hasGcc = compiler.available && compiler.verified;

const EXECUTION = normalizeExecutionConfig({
  language: 'c',
  standard: 'c11',
  optimization: 'O0',
  timeoutMs: 20000,
  maxOutputBytes: 256 * 1024,
  debugSymbols: true,
});

/** Compares two program outputs, ignoring trailing whitespace and line ends. */
function outputsMatch(actual: string, expected: string): boolean {
  const normalize = (text: string): string =>
    text
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .join('\n')
      .replace(/\n+$/, '')
      .trim();
  return normalize(actual) === normalize(expected);
}

describe('coding challenges', () => {
  it('ships challenges for every difficulty level', () => {
    const difficulties = new Set(CODING_CHALLENGES.map((challenge) => challenge.difficulty));
    expect(difficulties.has('beginner')).toBe(true);
    expect(difficulties.has('intermediate')).toBe(true);
    expect(difficulties.has('advanced')).toBe(true);
  });

  it('gives every challenge a complete description', () => {
    for (const challenge of CODING_CHALLENGES) {
      expect(challenge.title.length, challenge.id).toBeGreaterThan(0);
      expect(challenge.problemStatement.length, challenge.id).toBeGreaterThan(40);
      expect(challenge.inputFormat.length, challenge.id).toBeGreaterThan(10);
      expect(challenge.outputFormat.length, challenge.id).toBeGreaterThan(10);
      expect(challenge.constraints.length, challenge.id).toBeGreaterThan(0);
      expect(challenge.sampleCases.length, challenge.id).toBeGreaterThan(0);
      expect(challenge.practiceCases.length, challenge.id).toBeGreaterThan(0);
      expect(challenge.hiddenCases.length, challenge.id).toBeGreaterThan(0);
      expect(challenge.hints.length, challenge.id).toBeGreaterThan(0);
      expect(challenge.referenceSolution?.length ?? 0, challenge.id).toBeGreaterThan(50);
      expect(challenge.expectedComplexity?.time.length ?? 0, challenge.id).toBeGreaterThan(0);
    }
  });

  it('uses unique ids for the challenges and their test cases', () => {
    const challengeIds = CODING_CHALLENGES.map((challenge) => challenge.id);
    expect(new Set(challengeIds).size).toBe(challengeIds.length);

    const testCaseIds = CODING_CHALLENGES.flatMap((challenge) => [
      ...challenge.sampleCases,
      ...challenge.practiceCases,
      ...challenge.hiddenCases,
    ]).map((testCase) => testCase.id);
    expect(new Set(testCaseIds).size).toBe(testCaseIds.length);
  });

  it('marks every evaluation test as hidden and every sample as visible', () => {
    for (const challenge of CODING_CHALLENGES) {
      for (const testCase of challenge.sampleCases) {
        expect(testCase.hidden, testCase.id).toBe(false);
      }
      for (const testCase of challenge.practiceCases) {
        expect(testCase.hidden, testCase.id).toBe(false);
      }
      for (const testCase of challenge.hiddenCases) {
        expect(testCase.hidden, testCase.id).toBe(true);
      }
    }
  });

  it('produces the expected output for every test case of every challenge', async () => {
    if (!hasGcc) {
      return;
    }

    const service = new ExecutionService(new GCCCompiler(compiler));
    const failures: string[] = [];

    for (const challenge of CODING_CHALLENGES) {
      const directory = createWorkingDirectory('daa-challenge-check-');
      const compiled = service.compile(
        challenge.referenceSolution ?? '',
        {
          compilerPath: null,
          standard: 'c11',
          optimization: 'O0',
          warningLevel: 'basic',
          debugSymbols: true,
          extraArgs: [],
        },
        directory,
        'solution.c'
      );

      if (!compiled.success || !compiled.binaryPath) {
        failures.push(
          `${challenge.id}: the reference solution did not compile — ${compiled.diagnostics
            .filter((d) => d.severity === 'error')
            .map((d) => d.message)
            .join('; ')}`
        );
        removeWorkingDirectory(directory);
        continue;
      }

      const allCases: ChallengeTestCase[] = [
        ...challenge.sampleCases,
        ...challenge.practiceCases,
        ...challenge.hiddenCases,
      ];

      for (const testCase of allCases) {
        const result = await service.runBinary(compiled.binaryPath, {
          programId: challenge.id,
          execution: EXECUTION,
          stdin: testCase.input,
          cwd: directory,
        });

        if (result.status !== 'success') {
          failures.push(
            `${challenge.id}/${testCase.id}: the reference solution ended with "${result.status}" (stderr: ${result.stderr.trim().slice(0, 120)})`
          );
          continue;
        }

        if (!outputsMatch(result.stdout, testCase.expectedOutput)) {
          failures.push(
            `${challenge.id}/${testCase.id}: expected ${JSON.stringify(testCase.expectedOutput)} but got ${JSON.stringify(result.stdout.trim())}`
          );
        }
      }

      removeWorkingDirectory(directory);
    }

    expect(failures).toEqual([]);
  }, 600000);

  it('keeps the hidden test cases out of the public view', async () => {
    const { toPublicChallenge } = await import('../../../src/core/challenges/ChallengeRegistry');
    const challenge = CODING_CHALLENGES[0];
    const view = toPublicChallenge(challenge);

    expect(view.hiddenCases).toBeUndefined();
    expect(JSON.stringify(view)).not.toContain(challenge.hiddenCases[0].input);
  });

  it('writes the reference solution to disk unchanged', () => {
    const challenge = CODING_CHALLENGES[0];
    const file = path.join(os.tmpdir(), 'daa-reference-check.c');
    fs.writeFileSync(file, challenge.referenceSolution ?? '', 'utf8');
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toBe(challenge.referenceSolution);
    fs.rmSync(file, { force: true });
  });
});
