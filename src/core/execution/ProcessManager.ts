import { spawn, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { normalizeExecutionConfig } from './ExecutionConfig';
import type { ExecutionConfig } from '../playground/types';

/**
 * Runs a locally compiled program in a controlled way.
 *
 * Safety properties enforced here:
 * - the program is started without a shell, from a unique temporary directory
 * - stdout/stderr are capped so a runaway program cannot exhaust memory
 * - the run is stopped after the configured timeout
 * - the whole process tree is terminated on timeout or cancellation
 * - only a small, explicit subset of environment variables is passed on
 */

export interface CancellationSignal {
  aborted: boolean;
}

export interface RunOptions {
  executablePath: string;
  args?: string[];
  cwd: string;
  stdin?: string;
  config: ExecutionConfig;
  signal?: CancellationSignal;
}

export interface RunOutcome {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
  timedOut: boolean;
  cancelled: boolean;
  truncated: boolean;
  commandLine: string;
  /** True when the program was stopped because it exceeded the timeout. */
  stoppedByTimeout: boolean;
}

/**
 * Builds the minimal environment handed to the program.
 * Everything else of the user's environment stays private.
 */
export function buildSanitizedEnv(extra?: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const allowed = [
    'PATH',
    'Path',
    'SystemRoot',
    'WINDIR',
    'HOME',
    'USERPROFILE',
    'TMPDIR',
    'TEMP',
    'TMP',
    'SHELL',
    'LANG',
    'SystemDrive',
    'COMSPEC',
    'PATHEXT',
  ];

  const env: NodeJS.ProcessEnv = {};
  for (const key of allowed) {
    const value = process.env[key];
    if (value !== undefined) {
      env[key] = value;
    }
  }

  // Deterministic number formatting so test comparisons stay stable.
  env.LC_ALL = 'C';

  return { ...env, ...extra };
}

/** Creates a unique working directory for one program run. */
export function createWorkingDirectory(prefix = 'daa-run-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Removes a directory tree, ignoring failures. */
export function removeWorkingDirectory(directory: string | null): void {
  if (!directory) {
    return;
  }
  try {
    fs.rmSync(directory, { recursive: true, force: true });
  } catch {
    // Best effort cleanup — a locked file must not break the extension.
  }
}

/** Terminates a process and every child it spawned. */
export function killProcessTree(pid: number | undefined): void {
  if (!pid) {
    return;
  }

  if (process.platform === 'win32') {
    try {
      spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], {
        windowsHide: true,
        shell: false,
        timeout: 10000,
      });
    } catch {
      // Fall through to the direct kill below.
    }
  }

  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    // The process may already be gone.
  }
}

export class ProcessManager {
  /**
   * Executes a compiled program and collects its output.
   * Resolves once the program finished, timed out or was cancelled.
   */
  run(options: RunOptions): Promise<RunOutcome> {
    const config = normalizeExecutionConfig(options.config);
    const startedAt = Date.now();
    const commandLine = [options.executablePath, ...(options.args ?? [])];

    return new Promise<RunOutcome>((resolve) => {
      let stdout = '';
      let stderr = '';
      let stdoutBytes = 0;
      let stderrBytes = 0;
      let truncated = false;
      let timedOut = false;
      let cancelled = false;
      let settled = false;

      let child: ReturnType<typeof spawn>;
      try {
        child = spawn(options.executablePath, options.args ?? [], {
          cwd: options.cwd,
          env: buildSanitizedEnv(),
          shell: false,
          windowsHide: true,
          // A dedicated process group lets us terminate the whole tree on POSIX.
          detached: process.platform !== 'win32',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (error) {
        resolve({
          stdout: '',
          stderr: error instanceof Error ? error.message : String(error),
          exitCode: null,
          signal: null,
          durationMs: Date.now() - startedAt,
          timedOut: false,
          cancelled: false,
          truncated: false,
          commandLine: commandLine.join(' '),
          stoppedByTimeout: false,
        });
        return;
      }

      const finish = (exitCode: number | null, signalName: NodeJS.Signals | null): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutHandle);
        clearInterval(pollHandle);
        resolve({
          stdout,
          stderr,
          exitCode,
          signal: signalName,
          durationMs: Date.now() - startedAt,
          timedOut,
          cancelled,
          truncated,
          commandLine: commandLine.join(' '),
          stoppedByTimeout: timedOut,
        });
      };

      const stop = (): void => {
        killProcessTree(child.pid);
      };

      child.stdout?.on('data', (chunk: Buffer) => {
        if (stdoutBytes + chunk.length > config.maxOutputBytes) {
          const remaining = Math.max(0, config.maxOutputBytes - stdoutBytes);
          if (remaining > 0) {
            stdout += chunk.subarray(0, remaining).toString('utf8');
            stdoutBytes += remaining;
          }
          truncated = true;
          return;
        }
        stdoutBytes += chunk.length;
        stdout += chunk.toString('utf8');
      });

      child.stderr?.on('data', (chunk: Buffer) => {
        if (stderrBytes + chunk.length > config.maxOutputBytes) {
          const remaining = Math.max(0, config.maxOutputBytes - stderrBytes);
          if (remaining > 0) {
            stderr += chunk.subarray(0, remaining).toString('utf8');
            stderrBytes += remaining;
          }
          truncated = true;
          return;
        }
        stderrBytes += chunk.length;
        stderr += chunk.toString('utf8');
      });

      child.on('error', (error: Error) => {
        stderr += `${stderr ? '\n' : ''}${error.message}`;
        finish(null, null);
      });

      child.on('close', (code, signalName) => finish(code, signalName));

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        stop();
      }, config.timeoutMs);

      const pollHandle = setInterval(() => {
        if (options.signal?.aborted) {
          cancelled = true;
          stop();
        }
      }, 50);

      // Feed stdin and close it so programs that read once or many times all
      // receive the complete input.
      if (child.stdin) {
        child.stdin.on('error', () => {
          // The program may exit before reading all input; that is not an error.
        });
        if (options.stdin !== undefined && options.stdin.length > 0) {
          child.stdin.write(options.stdin);
        }
        child.stdin.end();
      }
    });
  }
}
