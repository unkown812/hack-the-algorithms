import { ExecutionService } from '../execution/ExecutionService';
import { compareOutputs, normalizeWhitespace } from '../testing/OutputComparator';
import { getAllTestCases, getRequiredTestCount } from './ChallengeRegistry';
import type {
  ChallengeSubmission,
  ChallengeTestCase,
  ChallengeTestResult,
  CodingChallenge,
  SubmissionStatus,
} from '../practice/types';

/**
 * Evaluates a submitted solution against the test cases of a challenge.
 *
 * The evaluation reuses the Phase 5 compiler and the Phase 5 execution
 * service — there is no second, less secure execution path. A solution is
 * only accepted when **every** test case passes, including the hidden ones.
 */

export interface EvaluationOptions {
  /** Time limit for a single test case. */
  timeoutMs?: number;
  /** Maximum size of the captured output. */
  maxOutputBytes?: number;
  /** Include the hidden test cases in the result (never for the webview). */
  includeHiddenDetails?: boolean;
}

export interface EvaluationSummary {
  submission: ChallengeSubmission;
  /** The feedback shown to the student. */
  feedback: string;
}

function statusForExit(
  exitCode: number | null,
  timedOut: boolean,
  outputMatch: boolean
): SubmissionStatus {
  if (timedOut) {
    return 'time-limit-exceeded';
  }
  if (exitCode !== 0) {
    return 'runtime-error';
  }
  return outputMatch ? 'accepted' : 'wrong-answer';
}

/** Compares the actual output with the expected output of a test case. */
export function compareTestOutput(
  actual: string,
  testCase: ChallengeTestCase
): boolean {
  const mode = testCase.comparisonMode ?? 'normalized';
  return compareOutputs(actual, testCase.expectedOutput, mode).passed;
}

export class ChallengeEvaluator {
  constructor(private readonly executionService: ExecutionService) {}

  /**
   * Compiles the submission and runs it against every test case.
   * A compilation error is reported without running anything.
   */
  async evaluate(
    challenge: CodingChallenge,
    source: string,
    options: EvaluationOptions = {}
  ): Promise<EvaluationSummary> {
    const startedAt = Date.now();
    const total = getRequiredTestCount(challenge);

    const { outcome: compilation, workingDirectory } = await this.executionService.compileOnce(
      source,
      {
        compilerPath: null,
        standard: 'c11',
        optimization: 'O0',
        warningLevel: 'basic',
        debugSymbols: true,
        extraArgs: [],
      },
      'solution.c'
    );

    if (!compilation.success || !compilation.binaryPath) {
      const errors = compilation.diagnostics.filter((d) => d.severity === 'error');
      ExecutionService.cleanup(workingDirectory);
      return {
        submission: {
          id: `submission-${startedAt.toString(36)}`,
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          challengeCategory: challenge.category,
          language: 'c',
          status: 'compile-error',
          passedTests: 0,
          totalTests: total,
          submittedAt: startedAt,
          durationMs: Date.now() - startedAt,
          source,
          testResults: [],
          diagnostics: compilation.diagnostics.map((diagnostic) => ({
            severity: diagnostic.severity,
            message: diagnostic.message,
            line: diagnostic.line,
            column: diagnostic.column,
            explanation: diagnostic.explanation,
          })),
        },
        feedback:
          errors.length > 0
            ? `The program did not compile. ${errors[0].explanation}`
            : 'The program did not compile.',
      };
    }

    const testResults: ChallengeTestResult[] = [];
    let passed = 0;

    for (const testCase of getAllTestCases(challenge)) {
      const result = await this.executionService.runBinary(compilation.binaryPath, {
        programId: challenge.id,
        execution: {
          language: 'c',
          standard: 'c11',
          optimization: 'O0',
          timeoutMs: options.timeoutMs ?? 5000,
          maxOutputBytes: options.maxOutputBytes ?? 256 * 1024,
          debugSymbols: true,
        },
        stdin: testCase.input,
        cwd: workingDirectory,
      });

      const matched = compareTestOutput(result.stdout, testCase);
      const status = statusForExit(result.exitCode, result.status === 'timeout', matched);

      if (status === 'accepted') {
        passed += 1;
      }

      testResults.push({
        testCaseId: testCase.id,
        hidden: testCase.hidden,
        passed: status === 'accepted',
        expectedOutput: testCase.hidden ? '' : testCase.expectedOutput,
        actualOutput: testCase.hidden ? '' : result.stdout,
        durationMs: result.durationMs,
        exitCode: result.exitCode,
        status,
        detail:
          status === 'accepted'
            ? undefined
            : status === 'time-limit-exceeded'
              ? 'The program exceeded the time limit.'
              : status === 'runtime-error'
                ? `The program exited with code ${result.exitCode ?? 'unknown'}.`
                : 'The output does not match the expected output.',
      });
    }

    const status: SubmissionStatus =
      passed === total
        ? 'accepted'
        : testResults.some((test) => test.status === 'compile-error')
          ? 'compile-error'
          : testResults.every((test) => test.status === 'time-limit-exceeded')
            ? 'time-limit-exceeded'
            : testResults.some((test) => test.status === 'runtime-error')
              ? 'runtime-error'
              : 'partial';

    ExecutionService.cleanup(workingDirectory);

    const submission: ChallengeSubmission = {
      id: `submission-${startedAt.toString(36)}`,
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      challengeCategory: challenge.category,
      language: 'c',
      status,
      passedTests: passed,
      totalTests: total,
      submittedAt: startedAt,
      durationMs: Date.now() - startedAt,
      source,
      testResults: options.includeHiddenDetails
        ? testResults
        : testResults.map((test) =>
          test.hidden
            ? { ...test, expectedOutput: '', actualOutput: '', detail: test.detail }
            : test
        ),
    };

    return { submission, feedback: buildFeedback(submission, total) };
  }
}

/** The educational feedback shown after a submission. */
export function buildFeedback(submission: ChallengeSubmission, totalTests: number): string {
  switch (submission.status) {
  case 'accepted':
    return `Accepted — all ${totalTests} test cases passed.`;
  case 'compile-error':
    return 'The program did not compile, so no test could run. Read the compiler message above.';
  case 'time-limit-exceeded':
    return 'The program exceeded the time limit. A more efficient algorithm usually helps here.';
  case 'runtime-error':
    return 'The program crashed or returned an error code. Check the array bounds and the input format.';
  default:
    return `${submission.passedTests} of ${totalTests} test cases passed. A solution is only accepted when every test case passes.`;
  }
}

/** A short summary of the visible test results (no hidden details). */
export function summarizeVisibleTests(results: ChallengeTestResult[]): {
  passed: number;
  failed: number;
  hidden: number;
  visible: number;
} {
  const visible = results.filter((result) => !result.hidden);
  return {
    passed: results.filter((result) => result.passed).length,
    failed: visible.filter((result) => !result.passed).length,
    hidden: results.filter((result) => result.hidden).length,
    visible: visible.length,
  };
}

/** Normalises the output for the comparison (exported for the tests). */
export { normalizeWhitespace };
