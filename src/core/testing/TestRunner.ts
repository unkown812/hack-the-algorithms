import { compareOutputs } from './OutputComparator';
import { ExecutionService } from '../execution/ExecutionService';
import { ExecutionSession } from '../execution/ExecutionSession';
import type {
  CompilerConfiguration,
  ExecutionConfig,
  TestCase,
  TestResult,
  TestRunSummary,
  TestStatus,
} from '../playground/types';

/**
 * Runs one or many test cases against a compiled student program.
 *
 * The program is compiled once and every test executes the same binary, so
 * the tests really measure the same program the student sees.
 */
export class TestRunner {
  constructor(private readonly executionService: ExecutionService) {}

  /** Runs a single test case against an already compiled binary. */
  async runTest(
    binaryPath: string,
    cwd: string,
    testCase: TestCase,
    config: ExecutionConfig
  ): Promise<TestResult> {
    const session = new ExecutionSession(`test-${testCase.id}`, null);
    const result = await this.executionService.runBinary(binaryPath, {
      programId: testCase.id,
      execution: config,
      stdin: testCase.input,
      cwd,
      session,
    });

    let status: TestStatus = 'passed';
    let detail: string | null = null;
    let diff: string[] | null = null;

    if (result.status === 'timeout') {
      status = 'timeout';
      detail = 'The program exceeded the time limit for this test.';
    } else if (result.status === 'cancelled') {
      status = 'cancelled';
      detail = 'The test run was cancelled.';
    } else if (result.status === 'runtime-error') {
      status = 'runtime-error';
      detail = `The program exited with code ${result.exitCode ?? 'unknown'}.`;
    } else {
      const comparison = compareOutputs(
        result.stdout,
        testCase.expectedOutput,
        testCase.comparisonMode,
        testCase.numericTolerance ?? 1e-6
      );
      status = comparison.passed ? 'passed' : 'failed';
      detail = comparison.passed ? null : comparison.detail;
      diff = comparison.diff.length > 0 ? comparison.diff : null;
    }

    return {
      testCaseId: testCase.id,
      name: testCase.name,
      status,
      expectedOutput: testCase.expectedOutput,
      actualOutput: result.stdout,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      detail,
      diff,
    };
  }

  /**
   * Compiles the program once and runs every test case against it.
   * A compilation error fails the whole run and is reported for every test.
   */
  async runAll(
    source: string,
    configuration: CompilerConfiguration,
    testCases: TestCase[],
    config: ExecutionConfig,
    fileName?: string
  ): Promise<TestRunSummary> {
    const startedAt = Date.now();

    if (testCases.length === 0) {
      return {
        passed: 0,
        failed: 0,
        errored: 0,
        total: 0,
        durationMs: Date.now() - startedAt,
        results: [],
      };
    }

    const { outcome, workingDirectory } = await this.executionService.compileOnce(
      source,
      configuration,
      fileName
    );

    if (!outcome.success || !outcome.binaryPath) {
      const errorMessage =
        outcome.diagnostics.find((d) => d.severity === 'error')?.message ??
        'The program could not be compiled.';
      const results: TestResult[] = testCases.map((testCase) => ({
        testCaseId: testCase.id,
        name: testCase.name,
        status: 'compile-error',
        expectedOutput: testCase.expectedOutput,
        actualOutput: '',
        exitCode: null,
        durationMs: 0,
        detail: errorMessage,
        diff: null,
      }));

      ExecutionService.cleanup(workingDirectory);

      return {
        passed: 0,
        failed: 0,
        errored: results.length,
        total: results.length,
        durationMs: Date.now() - startedAt,
        results,
      };
    }

    const results: TestResult[] = [];
    for (const testCase of testCases) {
      results.push(await this.runTest(outcome.binaryPath, workingDirectory, testCase, config));
    }

    ExecutionService.cleanup(workingDirectory);

    const passed = results.filter((r) => r.status === 'passed').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    return {
      passed,
      failed,
      errored: results.length - passed - failed,
      total: results.length,
      durationMs: Date.now() - startedAt,
      results,
    };
  }
}
