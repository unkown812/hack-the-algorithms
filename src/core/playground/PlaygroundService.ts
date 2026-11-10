import { GCCCompiler } from '../compiler/GCCCompiler';
import { ExecutionService } from '../execution/ExecutionService';
import { ExecutionSession } from '../execution/ExecutionSession';
import { TestRunner } from '../testing/TestRunner';
import { DebuggerService } from '../debugging/DebuggerService';
import { ExecutionTracer } from '../tracing/ExecutionTracer';
import { detectCompiler } from '../compiler/CompilerDetector';
import { createWorkingDirectory, removeWorkingDirectory } from '../execution/ProcessManager';
import type {
  CompileDiagnostic,
  CompilerConfiguration,
  CompilerInfo,
  DebuggerInfo,
  DebugSessionState,
  ExecutionConfig,
  ExecutionResult,
  TestCase,
  TestRunSummary,
  TraceEvent,
} from './types';

/**
 * Storage abstraction for saved programs and their test cases.
 * The extension host implements it with the VS Code storage APIs; the core
 * service never touches the file system for user data itself.
 */
export interface ProgramStorage {
  saveProgram(programId: string, name: string, source: string, algorithmId?: string): Promise<{
    filePath: string;
    updatedAt: number;
  }>;
  loadProgram(programId: string): Promise<string | null>;
  /** Absolute path of a saved program, when it exists. */
  getProgramPath(programId: string): Promise<string | null>;
  deleteProgram(programId: string): Promise<void>;
  listPrograms(): Promise<
    Array<{ id: string; name: string; filePath: string; algorithmId?: string; updatedAt: number }>
  >;
  saveTestCases(programId: string, testCases: TestCase[]): Promise<void>;
  loadTestCases(programId: string): Promise<TestCase[]>;
  recordHistory(entry: {
    programId: string;
    programName: string;
    algorithmId?: string;
    status: ExecutionResult['status'];
    compilerVersion: string;
    configuration: { standard: string; optimization: string; timeoutMs: number };
    input: string;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    durationMs: number;
    diagnosticCount: number;
  }): Promise<void>;
  listHistory(limit?: number): Promise<
    Array<{
      id: string;
      programId: string;
      programName: string;
      executedAt: number;
      status: string;
      input: string;
      stdout: string;
      stderr: string;
      exitCode: number | null;
      durationMs: number;
    }>
  >;
  clearHistory(): Promise<void>;
}

export const DEFAULT_COMPILER_CONFIGURATION: CompilerConfiguration = {
  compilerPath: null,
  standard: 'c11',
  optimization: 'O0',
  warningLevel: 'basic',
  debugSymbols: true,
  extraArgs: [],
};

export interface PlaygroundEvents {
  onStatus?: (status: DebugSessionState) => void;
  onTraceEvent?: (event: TraceEvent) => void;
  onOutput?: (chunk: { stream: 'stdout' | 'stderr'; text: string }) => void;
}

/**
 * Coordinates compilation, execution, debugging and testing for the Code
 * Playground. All long running work is asynchronous — the extension host is
 * never blocked.
 */
export class PlaygroundService {
  private compilerInfo: CompilerInfo;
  private executionService: ExecutionService;
  private debuggerService: DebuggerService;
  private testRunner: TestRunner;
  private compilerConfiguration: CompilerConfiguration = { ...DEFAULT_COMPILER_CONFIGURATION };

  private activeSession: ExecutionSession | null = null;
  private debugTracer: ExecutionTracer | null = null;
  private debugWorkingDirectory: string | null = null;
  private debugState: DebugSessionState = {
    status: 'idle',
    breakpoints: [],
    variables: [],
    callStack: [],
    traceEvents: [],
    counters: { comparisons: 0, swaps: 0, iterations: 0, reliable: false, note: '' },
  };

  constructor(
    private readonly storage: ProgramStorage,
    private readonly events: PlaygroundEvents = {}
  ) {
    this.compilerInfo = detectCompiler();
    this.executionService = new ExecutionService(new GCCCompiler(this.compilerInfo));
    this.debuggerService = new DebuggerService();
    this.testRunner = new TestRunner(this.executionService);
  }

  /** The current compiler status. */
  getCompilerInfo(): CompilerInfo {
    return this.compilerInfo;
  }

  /** The status of the local debugger. */
  getDebuggerInfo(): DebuggerInfo {
    return this.debuggerService.detect();
  }

  /** Re-runs the compiler detection. */
  refreshCompiler(): CompilerInfo {
    this.compilerInfo = detectCompiler({ configuredPath: this.compilerConfiguration.compilerPath });
    return this.compilerInfo;
  }

  /** The current compiler configuration. */
  getConfiguration(): CompilerConfiguration {
    return { ...this.compilerConfiguration };
  }

  /** Updates the compiler configuration and re-detects the compiler. */
  async updateConfiguration(configuration: Partial<CompilerConfiguration>): Promise<CompilerInfo> {
    this.compilerConfiguration = { ...this.compilerConfiguration, ...configuration };
    this.compilerInfo = detectCompiler({ configuredPath: this.compilerConfiguration.compilerPath });
    return this.compilerInfo;
  }

  /** The compiler settings that apply to the next compilation. */
  private effectiveCompilerConfiguration(executionConfig: ExecutionConfig): CompilerConfiguration {
    return {
      ...this.compilerConfiguration,
      standard: executionConfig.standard,
      optimization: executionConfig.optimization,
      debugSymbols: executionConfig.debugSymbols,
    };
  }

  /** Compiles and runs a program with the given stdin. */
  async run(
    source: string,
    programId: string,
    executionConfig: ExecutionConfig,
    stdin: string
  ): Promise<ExecutionResult> {
    const workingDirectory = createWorkingDirectory('daa-build-');
    const session = new ExecutionSession(`run-${Date.now().toString(36)}`, workingDirectory);
    this.activeSession = session;

    try {
      const result = await this.executionService.compileAndRun({
        source,
        programId,
        configuration: this.effectiveCompilerConfiguration(executionConfig),
        execution: executionConfig,
        stdin,
        session,
      });

      await this.storage.recordHistory({
        programId,
        programName: programId,
        status: result.status,
        compilerVersion: this.compilerInfo.version,
        configuration: {
          standard: executionConfig.standard,
          optimization: executionConfig.optimization,
          timeoutMs: executionConfig.timeoutMs,
        },
        input: stdin,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        durationMs: result.durationMs,
        diagnosticCount: result.diagnostics.length,
      });

      return result;
    } finally {
      this.activeSession = null;
      session.finish();
    }
  }

  /** Compiles the program without running it. */
  compile(
    source: string,
    executionConfig: ExecutionConfig
  ): { success: boolean; diagnostics: CompileDiagnostic[]; durationMs: number; commandLine: string } {
    const workingDirectory = createWorkingDirectory('daa-build-');
    try {
      const outcome = this.executionService.compile(
        source,
        this.effectiveCompilerConfiguration(executionConfig),
        workingDirectory,
        'program.c'
      );
      return {
        success: outcome.success,
        diagnostics: outcome.diagnostics,
        durationMs: outcome.durationMs,
        commandLine: GCCCompiler.formatCommandLine(outcome.commandLine),
      };
    } finally {
      removeWorkingDirectory(workingDirectory);
    }
  }

  /** Stops the running program. */
  stop(): void {
    this.activeSession?.cancel();
  }

  /** Runs the test cases of a program. */
  async runTests(
    source: string,
    testCases: TestCase[],
    executionConfig: ExecutionConfig
  ): Promise<TestRunSummary> {
    return this.testRunner.runAll(
      source,
      this.effectiveCompilerConfiguration(executionConfig),
      testCases,
      executionConfig
    );
  }

  // ---- debugging ----------------------------------------------------------

  /** The current debug session state. */
  getDebugState(): DebugSessionState {
    return { ...this.debugState };
  }

  /** Starts a debug session on the compiled program. */
  async startDebugging(
    source: string,
    algorithmId: string | null,
    breakpoints: number[],
    executionConfig: ExecutionConfig
  ): Promise<DebugSessionState> {
    await this.stopDebugging();

    const workingDirectory = createWorkingDirectory('daa-debug-');
    this.debugWorkingDirectory = workingDirectory;

    const compilation = this.executionService.compile(
      source,
      this.effectiveCompilerConfiguration(executionConfig),
      workingDirectory,
      'program.c'
    );

    if (!compilation.success || !compilation.binaryPath) {
      this.debugState = {
        ...this.debugState,
        status: 'error',
        message:
          compilation.diagnostics.find((d) => d.severity === 'error')?.message ??
          'The program could not be compiled.',
      };
      removeWorkingDirectory(workingDirectory);
      this.debugWorkingDirectory = null;
      this.emitStatus();
      return this.getDebugState();
    }

    this.debugTracer = new ExecutionTracer(source, algorithmId);
    this.debugState = {
      status: 'starting',
      message: 'Starting the debugger…',
      breakpoints: [...breakpoints],
      variables: [],
      callStack: [],
      traceEvents: [],
      counters: { comparisons: 0, swaps: 0, iterations: 0, reliable: false, note: '' },
    };
    this.emitStatus();

    try {
      await this.debuggerService.start({
        binaryPath: compilation.binaryPath,
        workingDirectory,
        sourceFileName: 'program.c',
        breakpoints,
        timeoutMs: executionConfig.timeoutMs,
      });

      const stop = await this.debuggerService.run();
      await this.applyStop(stop);
      this.debugState = { ...this.debugState, status: 'paused' };
      this.emitStatus();
    } catch (error) {
      this.debugState = {
        ...this.debugState,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      };
      this.emitStatus();
    }

    return this.getDebugState();
  }

  /** Continues the running program. */
  async continueDebugging(): Promise<DebugSessionState> {
    return this.stepDebugging('continue');
  }

  /** Performs one debug step. */
  async stepDebugging(
    action: 'over' | 'into' | 'out' | 'continue'
  ): Promise<DebugSessionState> {
    if (!this.debuggerService.isRunning) {
      this.debugState = { ...this.debugState, status: 'idle', message: 'No debug session is running.' };
      this.emitStatus();
      return this.getDebugState();
    }

    this.debugState = { ...this.debugState, status: 'running' };
    this.emitStatus();

    try {
      const stop =
        action === 'over'
          ? await this.debuggerService.stepOver()
          : action === 'into'
            ? await this.debuggerService.stepInto()
            : action === 'out'
              ? await this.debuggerService.stepOut()
              : await this.debuggerService.resume();

      await this.applyStop(stop);
      this.debugState = {
        ...this.debugState,
        status: stop.exited ? 'stopped' : 'paused',
        message: stop.exited ? 'The program finished.' : undefined,
      };
      this.emitStatus();
    } catch (error) {
      this.debugState = {
        ...this.debugState,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      };
      this.emitStatus();
    }

    return this.getDebugState();
  }

  /** Ends the debug session. */
  async stopDebugging(): Promise<void> {
    if (this.debuggerService.isRunning) {
      await this.debuggerService.stop();
    }
    if (this.debugWorkingDirectory) {
      removeWorkingDirectory(this.debugWorkingDirectory);
      this.debugWorkingDirectory = null;
    }
    this.debugTracer = null;
    this.debugState = {
      status: 'idle',
      breakpoints: [],
      variables: [],
      callStack: [],
      traceEvents: [],
      counters: { comparisons: 0, swaps: 0, iterations: 0, reliable: false, note: '' },
    };
    this.emitStatus();
  }

  private async applyStop(
    stop: {
      reason: string;
      file: string;
      line: number;
      functionName: string;
      output: string;
      exited: boolean;
      variables: DebugSessionState['variables'];
      callStack: DebugSessionState['callStack'];
    }
  ): Promise<void> {
    const tracer = this.debugTracer;
    if (!tracer) {
      this.debugState = {
        ...this.debugState,
        currentLine: stop.line,
        currentFunction: stop.functionName,
        variables: stop.variables,
        callStack: stop.callStack,
      };
      return;
    }
    let arrayValues: number[] | undefined;
    const arrayName = tracer.sourceMap.arrayName;
    if (arrayName && !stop.exited) {
      arrayValues = (await this.debuggerService.readNumericArray(arrayName)) ?? undefined;
    }

    const snapshot = tracer.record(stop, arrayValues);
    const latestEvent = snapshot.events[snapshot.events.length - 1];

    this.debugState = {
      ...this.debugState,
      currentLine: stop.line,
      currentFunction: stop.functionName,
      variables: stop.variables,
      callStack: stop.callStack,
      traceEvents: snapshot.events.slice(-200),
      counters: snapshot.counters,
    };

    if (latestEvent) {
      this.events.onTraceEvent?.(latestEvent);
    }
  }

  private emitStatus(): void {
    this.events.onStatus?.(this.getDebugState());
  }
}
