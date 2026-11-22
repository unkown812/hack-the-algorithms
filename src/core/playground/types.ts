/**
 * Shared types for the Phase 5 Code Playground.
 *
 * This module is imported by both the extension host and the webview, so it
 * must not import any Node.js built-in and must stay free of side effects.
 */

export type CompilerStandard = 'c99' | 'c11' | 'c17';
export type OptimizationLevel = 'O0' | 'O1' | 'O2';
export type WarningLevel = 'none' | 'basic' | 'extra';

export interface CompilerInfo {
  id: string;
  name: string;
  executablePath: string;
  version: string;
  available: boolean;
  supportedStandards: string[];
  /** True when the toolchain answered a real compile-and-run smoke test. */
  verified: boolean;
  platform: string;
  detectedAt: number;
  /** Human readable reason when the compiler is unavailable. */
  unavailableReason?: string;
  /** Guidance shown when no compiler was found. */
  installHint?: string;
}

export interface CompilerConfiguration {
  /** Absolute path to the compiler executable; null means "auto-detect". */
  compilerPath: string | null;
  standard: CompilerStandard;
  optimization: OptimizationLevel;
  warningLevel: WarningLevel;
  debugSymbols: boolean;
  /** Extra arguments appended after the fixed, safety-checked flags. */
  extraArgs: string[];
}

export type DiagnosticCategory =
  | 'syntax-error'
  | 'missing-header'
  | 'undeclared-variable'
  | 'type-mismatch'
  | 'function-declaration'
  | 'missing-semicolon'
  | 'invalid-expression'
  | 'linker-error'
  | 'warning'
  | 'other';

export interface CompileDiagnostic {
  id: string;
  severity: 'error' | 'warning' | 'note';
  file: string;
  line: number;
  column: number | null;
  message: string;
  category: DiagnosticCategory;
  /** Beginner friendly explanation of what the message means. */
  explanation: string;
  /** The offending source line, when it could be read from the file. */
  sourceLine: string | null;
  /** Concrete next step for the student. */
  suggestion: string | null;
}

export type ExecutionStatus =
  | 'success'
  | 'compile-error'
  | 'runtime-error'
  | 'timeout'
  | 'cancelled'
  | 'not-compiled'
  | 'internal-error';

export interface ExecutionConfig {
  language: string;
  standard: CompilerStandard;
  optimization: OptimizationLevel;
  timeoutMs: number;
  maxOutputBytes: number;
  debugSymbols: boolean;
}

export interface ExecutionResult {
  id: string;
  programId: string;
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  startedAt: number;
  completedAt: number;
  /** True when output was truncated because of the configured byte cap. */
  outputTruncated: boolean;
  compileDurationMs?: number;
  diagnostics: CompileDiagnostic[];
  /** Set when the run was stopped because the timeout elapsed. */
  timedOut?: boolean;
  /** Set when the student cancelled the run. */
  cancelled?: boolean;
  /** Command line that was executed (for transparency in the UI). */
  commandLine?: string;
}

export type TraceEventType =
  | 'line'
  | 'variable-created'
  | 'variable-updated'
  | 'condition'
  | 'function-entered'
  | 'function-exited'
  | 'array-accessed'
  | 'array-modified'
  | 'loop-iteration'
  | 'breakpoint-hit'
  | 'output';

export interface TraceVariable {
  name: string;
  type: string;
  value: string;
  scope: string;
  memoryAddress?: string;
  children?: TraceVariable[];
  /** True when the value could not be resolved (e.g. out of scope). */
  unavailable?: boolean;
}

export interface TraceEvent {
  id: number;
  sequence: number;
  type: TraceEventType;
  file: string;
  line: number;
  functionName?: string;
  description: string;
  variables: TraceVariable[];
  /** Index of the element currently being compared (array algorithms). */
  comparedIndices?: number[];
  /** Index of the element currently being swapped (array algorithms). */
  swappedIndices?: number[];
  /** Live array contents when a watched array variable exists. */
  arrayValues?: number[];
  /** Name of the watched array variable. */
  arrayName?: string;
  timestamp: number;
}

export type ComparisonMode = 'exact' | 'normalized' | 'numeric';

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  comparisonMode: ComparisonMode;
  description?: string;
  /** Absolute tolerance used by the `numeric` comparison mode. */
  numericTolerance?: number;
}

export type TestStatus = 'passed' | 'failed' | 'compile-error' | 'runtime-error' | 'timeout' | 'cancelled';

export interface TestResult {
  testCaseId: string;
  name: string;
  status: TestStatus;
  expectedOutput: string;
  actualOutput: string;
  exitCode: number | null;
  durationMs: number;
  /** Explanation of why the comparison failed. */
  detail: string | null;
  /** Differences between expected and actual output (truncated). */
  diff: string[] | null;
}

export interface TestRunSummary {
  passed: number;
  failed: number;
  errored: number;
  total: number;
  durationMs: number;
  results: TestResult[];
}

export interface SavedProgram {
  id: string;
  name: string;
  /** Path of the .c file inside the workspace. */
  filePath: string;
  language: string;
  /** Optional link to an algorithm of the registry. */
  algorithmId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExecutionHistoryEntry {
  id: string;
  programId: string;
  programName: string;
  algorithmId?: string;
  executedAt: number;
  status: ExecutionStatus;
  compilerVersion: string;
  configuration: {
    standard: CompilerStandard;
    optimization: OptimizationLevel;
    timeoutMs: number;
  };
  input: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  diagnosticCount: number;
}

export interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  /** Optional algorithm of the registry the template illustrates. */
  algorithmId?: string;
  source: string;
}

export interface DebuggerInfo {
  available: boolean;
  executablePath: string;
  version: string;
  /** Features the detected debugger can actually provide. */
  capabilities: string[];
  unavailableReason?: string;
  installHint?: string;
}

export interface DebugSessionState {
  status: 'idle' | 'starting' | 'running' | 'paused' | 'stopped' | 'error';
  message?: string;
  currentLine?: number;
  currentFunction?: string;
  breakpoints: number[];
  variables: TraceVariable[];
  callStack: CallStackFrame[];
  traceEvents: TraceEvent[];
  /** Counters derived from the traced execution (only for supported algorithms). */
  counters: {
    comparisons: number;
    swaps: number;
    iterations: number;
    /** True when the counters were derived from real source analysis. */
    reliable: boolean;
    note: string;
  };
}

export interface CallStackFrame {
  level: number;
  functionName: string;
  file: string;
  line: number;
  address?: string;
}
