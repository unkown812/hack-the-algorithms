import { describe, expect, it } from 'vitest';
import { ChallengeEvaluator } from '../../../src/core/challenges/ChallengeEvaluator';
import { ExecutionService } from '../../../src/core/execution/ExecutionService';
import { GCCCompiler } from '../../../src/core/compiler/GCCCompiler';
import { detectCompiler } from '../../../src/core/compiler/CompilerDetector';
import {
  getChallengeById,
  toPublicChallenge,
  filterChallenges,
  getRequiredTestCount,
} from '../../../src/core/challenges/ChallengeRegistry';

const compiler = detectCompiler();
const hasGcc = compiler.available && compiler.verified;

const evaluator = new ChallengeEvaluator(
  new ExecutionService(new GCCCompiler(compiler))
);

describe('challenge registry', () => {
  it('lists the challenges by category and difficulty', () => {
    const sorting = filterChallenges({ category: 'sorting' });
    expect(sorting.length).toBeGreaterThan(0);
    expect(sorting.every((challenge) => challenge.category === 'sorting')).toBe(true);

    const beginner = filterChallenges({ difficulty: 'beginner' });
    expect(beginner.every((challenge) => challenge.difficulty === 'beginner')).toBe(true);
  });

  it('keeps the hidden test cases out of the public view', () => {
    const challenge = getChallengeById('ch-find-minimum')!;
    const view = toPublicChallenge(challenge);

    expect(view.hiddenCases).toBeUndefined();
    expect(view.hiddenCaseCount).toBe(challenge.hiddenCases.length);
    expect(JSON.stringify(view)).not.toContain(challenge.hiddenCases[0].input);
  });

  it('does not reveal the reference solution by default', () => {
    const challenge = getChallengeById('ch-find-minimum')!;

    expect(toPublicChallenge(challenge).referenceSolution).toBeUndefined();
    expect(toPublicChallenge(challenge, true).referenceSolution).toBe(challenge.referenceSolution);
  });

  it('counts every test case that has to pass', () => {
    const challenge = getChallengeById('ch-find-minimum')!;
    const expected =
      challenge.sampleCases.length +
      challenge.practiceCases.length +
      challenge.hiddenCases.length;

    expect(getRequiredTestCount(challenge)).toBe(expected);
  });
});

describe('challenge evaluation', () => {
  it('accepts a correct solution', async () => {
    if (!hasGcc) {
      return;
    }

    const challenge = getChallengeById('ch-find-minimum')!;
    const { submission, feedback } = await evaluator.evaluate(
      challenge,
      `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int min = 0;
    for (int i = 0; i < n; i++) {
        int value;
        scanf("%d", &value);
        if (i == 0 || value < min) {
            min = value;
        }
    }
    printf("%d\\n", min);
    return 0;
}`
    );

    expect(submission.status).toBe('accepted');
    expect(submission.passedTests).toBe(submission.totalTests);
    expect(feedback).toMatch(/accepted/i);
  });

  it('rejects a wrong solution and keeps the failed tests visible', async () => {
    if (!hasGcc) {
      return;
    }

    const challenge = getChallengeById('ch-find-minimum')!;
    const { submission } = await evaluator.evaluate(
      challenge,
      `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    printf("%d\\n", 0);
    return 0;
}`
    );

    expect(submission.status).toBe('partial');
    expect(submission.passedTests).toBe(0);

    const visible = submission.testResults.filter((test) => !test.hidden);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible[0].passed).toBe(false);
  });

  it('reports a compilation error without running anything', async () => {
    if (!hasGcc) {
      return;
    }

    const challenge = getChallengeById('ch-find-minimum')!;
    const { submission, feedback } = await evaluator.evaluate(
      challenge,
      'int main(void) { this is not c }'
    );

    expect(submission.status).toBe('compile-error');
    expect(submission.passedTests).toBe(0);
    expect(submission.testResults).toHaveLength(0);
    expect(submission.diagnostics?.length ?? 0).toBeGreaterThan(0);
    expect(feedback).toMatch(/did not compile/i);
  });

  it('never leaks the hidden test inputs or outputs', async () => {
    if (!hasGcc) {
      return;
    }

    const challenge = getChallengeById('ch-find-minimum')!;
    const { submission } = await evaluator.evaluate(
      challenge,
      '#include <stdio.h>\nint main(void){int n;scanf("%d",&n);printf("%d\\n",0);return 0;}'
    );

    for (const test of submission.testResults.filter((entry) => entry.hidden)) {
      expect(test.expectedOutput).toBe('');
      expect(test.actualOutput).toBe('');
    }
  });

  it('reports a runtime error', async () => {
    if (!hasGcc) {
      return;
    }

    const challenge = getChallengeById('ch-find-minimum')!;
    const { submission } = await evaluator.evaluate(
      challenge,
      `#include <stdio.h>

int main(void) {
    int *pointer = 0;
    printf("%d\\n", *pointer);
    return 0;
}`
    );

    expect(['runtime-error', 'partial']).toContain(submission.status);
    expect(submission.passedTests).toBe(0);
  });
});
