import * as fs from 'node:fs';
import { GCCCompiler } from '../compiler/GCCCompiler';
import type { CompileOutcome } from '../compiler/GCCCompiler';
import { ProcessManager, createWorkingDirectory } from './ProcessManager';
import { ExecutionSession } from './ExecutionSession';
import { normalizeExecutionConfig } from './ExecutionConfig';
import type {
  CompileDiagnostic,
  CompilerConfiguration,
  ExecutionConfig,
  ExecutionResult,
  ExecutionStatus,
} from '../playground/types';

/**
 * Orchestrates the local "compile then run" flow.
 *
 * Every run happens in its own temporary directory; the source file and the
 * produced executable never leave the machine.
 */

let sessionCounter = 0;

function nextSessionId(): string {
  sessionCounter += 1;
  return `exec-${Date.now().toString(36)}-${sessionCounter}`;
}

export interface CompileAndRunRequest {
  source: string;
  programId: string;
  configuration: CompilerConfiguration;
  execution: ExecutionConfig;
  stdin?: string;
  fileName?: string;
  /** Cancels the run when it is set. */
  session?: ExecutionSession;
}

export class ExecutionService {
  constructor(
    private readonly compiler: GCCCompiler,
    private readonly processManager: ProcessManager = new ProcessManager()
  ) {}

  /** Compiles the source into a temporary directory. */
  compile(
    source: string,
    configuration: CompilerConfiguration,
    workingDirectory?: string,
    fileName?: string
  ): CompileOutcome {
    return this.compiler.compile({
      source,
      configuration,
      outputDirectory: workingDirectory,
      fileName,
    });
  }

  /** Runs an already compiled executable. */
  async runBinary(
    binaryPath: string,
    request: Omit<CompileAndRunRequest, 'source' | 'configuration'> & { cwd: string }
  ): Promise<ExecutionResult> {
    const config = normalizeExecutionConfig(request.execution);
    const session = request.session;
    const id = nextSessionId();

    const outcome = await this.processManager.run({
      executablePath: binaryPath,
      cwd: request.cwd,
      stdin: request.stdin ?? '',
      config,
      signal: session?.signal,
    });

    let status: ExecutionStatus = 'success';
    if (outcome.timedOut) {
      status = 'timeout';
    } else if (outcome.cancelled || session?.isCancelled) {
      status = 'cancelled';
    } else if (outcome.exitCode !== 0) {
      status = 'runtime-error';
    }

    return {
      id,
      programId: request.programId,
      status,
      stdout: outcome.stdout,
      stderr: outcome.stderr,
      exitCode: outcome.exitCode,
      durationMs: outcome.durationMs,
      startedAt: Date.now() - outcome.durationMs,
      completedAt: Date.now(),
      outputTruncated: outcome.truncated,
      diagnostics: [],
      timedOut: outcome.timedOut,
      cancelled: outcome.cancelled || Boolean(session?.isCancelled),
      commandLine: outcome.commandLine,
    };
  }

  /**
   * Compiles and runs the program in one step.
   * A failed compilation is reported as a `compile-error` result — it never
   * pretends that the program ran.
   */
  async compileAndRun(request: CompileAndRunRequest): Promise<ExecutionResult> {
    const config = normalizeExecutionConfig(request.execution);
    const workingDirectory = createWorkingDirectory('daa-build-');
    const session = request.session ?? new ExecutionSession(nextSessionId(), workingDirectory);

    try {
      const compilation = this.compile(
        request.source,
        request.configuration,
        workingDirectory,
        request.fileName
      );

      if (!compilation.success || !compilation.binaryPath) {
        return {
          id: session.id,
          programId: request.programId,
          status: 'compile-error',
          stdout: '',
          stderr: compilation.rawOutput,
          exitCode: null,
          durationMs: compilation.durationMs,
          startedAt: session.startedAt,
          completedAt: Date.now(),
          outputTruncated: false,
          compileDurationMs: compilation.durationMs,
          diagnostics: compilation.diagnostics,
          commandLine: GCCCompiler.formatCommandLine(compilation.commandLine),
        };
      }

      const result = await this.runBinary(compilation.binaryPath, {
        programId: request.programId,
        execution: config,
        stdin: request.stdin,
        cwd: workingDirectory,
        session,
      });

      return {
        ...result,
        id: session.id,
        compileDurationMs: compilation.durationMs,
        diagnostics: compilation.diagnostics,
        commandLine: GCCCompiler.formatCommandLine(compilation.commandLine),
      };
    } finally {
      session.finish();
    }
  }

  /** Compiles once and runs the executable several times (used by test runs). */
  async compileOnce(
    source: string,
    configuration: CompilerConfiguration,
    fileName?: string
  ): Promise<{ outcome: CompileOutcome; workingDirectory: string }> {
    const workingDirectory = createWorkingDirectory('daa-build-');
    const outcome = this.compile(source, configuration, workingDirectory, fileName);
    return { outcome, workingDirectory };
  }

  /** Removes a temporary directory created by compileOnce. */
  static cleanup(directory: string): void {
    try {
      fs.rmSync(directory, { recursive: true, force: true });
    } catch {
      // Best effort.
    }
  }
}

/** Convenience helper that maps a result to a short, human readable summary. */
export function summarizeResult(result: ExecutionResult): string {
  switch (result.status) {
  case 'success':
    return `Program finished successfully in ${result.durationMs} ms.`;
  case 'compile-error': {
    const errors = result.diagnostics.filter((d) => d.severity === 'error').length;
    return `Compilation failed with ${errors} error${errors === 1 ? '' : 's'}.`;
  }
  case 'runtime-error':
    return `Program exited with code ${result.exitCode ?? 'unknown'}.`;
  case 'timeout':
    return 'The program was stopped because it exceeded the time limit.';
  case 'cancelled':
    return 'The program was stopped by the user.';
  case 'not-compiled':
    return 'The program was not compiled.';
  default:
    return 'The execution ended with an internal error.';
  }
}

/** Re-exported for convenience. */
export type { CompileDiagnostic };
