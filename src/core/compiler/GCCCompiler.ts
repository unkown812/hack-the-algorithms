import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { parseCompilerDiagnostics, hasErrors } from './CompilerDiagnostics';
import type { CompileDiagnostic, CompilerConfiguration, CompilerInfo } from '../playground/types';

/**
 * Compiles C source code with the detected GCC toolchain.
 *
 * The command line is always built as an argument array — never as a shell
 * string — so nothing in the student's source or configuration can turn into
 * an extra shell command.
 */

export interface CompileRequest {
  source: string;
  configuration: CompilerConfiguration;
  /** Directory the executable is written to; created when missing. */
  outputDirectory?: string;
  /** File name used for the source file (used in diagnostics). */
  fileName?: string;
}

export interface CompileOutcome {
  success: boolean;
  /** Absolute path of the produced executable (null when compilation failed). */
  binaryPath: string | null;
  diagnostics: CompileDiagnostic[];
  durationMs: number;
  /** The exact argument vector that was executed. */
  commandLine: string[];
  /** Raw compiler output, kept for the console view. */
  rawOutput: string;
}

/**
 * Flags that would let a configuration escape the intended compilation model.
 * They are rejected instead of being silently dropped, so the student always
 * knows that their arguments were refused.
 */
const FORBIDDEN_ARG_PATTERNS: RegExp[] = [
  /^-o$/i,
  /^-o.+/i,
  /^-wrapper/i,
  /^-specs=/i,
  /^-fplugin/i,
  /^-B/i,
  /@/,
  /[;&|`$<>]/,
];

export class CompilerArgumentError extends Error {
  constructor(rejected: string) {
    super(`The compiler argument "${rejected}" is not allowed.`);
    this.name = 'CompilerArgumentError';
  }
}

/** Validates the student supplied extra arguments. */
export function validateExtraArgs(args: string[]): void {
  for (const arg of args) {
    if (arg.trim() === '') {
      continue;
    }
    for (const pattern of FORBIDDEN_ARG_PATTERNS) {
      if (pattern.test(arg)) {
        throw new CompilerArgumentError(arg);
      }
    }
  }
}

/** Maps the configuration onto concrete GCC flags. */
export function buildCompilerArgs(configuration: CompilerConfiguration): string[] {
  const args: string[] = [`-std=${configuration.standard}`];

  args.push(`-${configuration.optimization}`);
  args.push('-Wall');

  if (configuration.warningLevel === 'extra') {
    args.push('-Wextra');
  }

  if (configuration.debugSymbols) {
    args.push('-g');
  }

  args.push(...configuration.extraArgs.filter((arg) => arg.trim() !== ''));

  return args;
}

/** Quote an argument for display only (the real execution never uses a shell). */
function displayArgs(args: string[]): string {
  return args
    .map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg))
    .join(' ');
}

export class GCCCompiler {
  constructor(private readonly compiler: CompilerInfo) {}

  /** True when a usable compiler is configured. */
  isUsable(): boolean {
    return this.compiler.available && this.compiler.executablePath.length > 0;
  }

  /**
   * Compiles the source. Never throws for ordinary compiler failures — a
   * failed compilation is a normal outcome that carries diagnostics.
   */
  compile(request: CompileRequest): CompileOutcome {
    const startedAt = Date.now();
    const configuration = request.configuration;
    const fileName = request.fileName ?? 'program.c';

    validateExtraArgs(configuration.extraArgs);

    if (!this.isUsable()) {
      const diagnostics: CompileDiagnostic[] = [
        {
          id: 'diag-no-compiler',
          severity: 'error',
          file: fileName,
          line: 0,
          column: null,
          message: this.compiler.unavailableReason ?? 'No C compiler is available.',
          category: 'other',
          explanation:
            'The extension needs a local C compiler to build the program. Configure the path to gcc.exe or install a GCC toolchain.',
          suggestion: this.compiler.installHint ?? 'Install GCC and configure the compiler path.',
          sourceLine: null,
        },
      ];
      return {
        success: false,
        binaryPath: null,
        diagnostics,
        durationMs: Date.now() - startedAt,
        commandLine: [],
        rawOutput: '',
      };
    }

    const outputDirectory =
      request.outputDirectory ?? fs.mkdtempSync(path.join(os.tmpdir(), 'daa-build-'));
    fs.mkdirSync(outputDirectory, { recursive: true });

    const sourcePath = path.join(outputDirectory, fileName);
    const binaryPath = path.join(outputDirectory, 'program.exe');
    const sourceLines = request.source.split(/\r?\n/);

    fs.writeFileSync(sourcePath, request.source, 'utf8');

    const compileArgs = [...buildCompilerArgs(configuration), '-o', binaryPath, sourcePath];

    let rawOutput = '';
    let status: number | null = null;
    try {
      const result = spawnSync(this.compiler.executablePath, compileArgs, {
        encoding: 'utf8',
        timeout: 60000,
        windowsHide: true,
        shell: false,
        cwd: outputDirectory,
      });
      rawOutput = `${result.stdout ?? ''}${result.stderr ?? ''}`;
      status = result.status;
      if (result.error) {
        rawOutput += `\n${result.error.message}`;
      }
    } catch (error) {
      rawOutput = error instanceof Error ? error.message : String(error);
      status = -1;
    }

    const diagnostics = parseCompilerDiagnostics(rawOutput, sourceLines);
    const success = status === 0 && !hasErrors(diagnostics) && fs.existsSync(binaryPath);

    if (!success && diagnostics.length === 0) {
      diagnostics.push({
        id: 'diag-compile-failed',
        severity: 'error',
        file: fileName,
        line: 0,
        column: null,
        message: rawOutput.trim() || 'The compiler did not produce an executable.',
        category: 'other',
        explanation:
          'The compiler stopped without a readable message. Re-run the compilation to see the full output in the console.',
        suggestion: 'Check the compiler output in the console panel for details.',
        sourceLine: null,
      });
    }

    return {
      success,
      binaryPath: success ? binaryPath : null,
      diagnostics,
      durationMs: Date.now() - startedAt,
      commandLine: [this.compiler.executablePath, ...compileArgs],
      rawOutput: rawOutput.trim(),
    };
  }

  /** Human readable representation of a command line (for the UI). */
  static formatCommandLine(commandLine: string[]): string {
    if (commandLine.length === 0) {
      return '';
    }
    return `${commandLine[0]} ${displayArgs(commandLine.slice(1))}`;
  }
}
