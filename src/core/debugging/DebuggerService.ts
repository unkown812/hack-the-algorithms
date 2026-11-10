import { existsSync } from 'node:fs';
import { GDBAdapter, miObject, miString } from './GDBAdapter';
import type { MiRecord } from './GDBAdapter';
import { VariableInspector } from './VariableInspector';
import { detectDebuggerExecutable } from '../compiler/CompilerDetector';
import type { CallStackFrame, DebuggerInfo, TraceVariable } from '../playground/types';

/**
 * High level debugging service built on top of the GDB machine interface.
 *
 * The service never invents debugging information: when GDB is not available
 * the service reports that fact and the UI hides the debugging controls.
 */

export interface DebugStop {
  reason: string;
  file: string;
  line: number;
  functionName: string;
  /** Program output produced so far (captured from the console stream). */
  output: string;
  exited: boolean;
  variables: TraceVariable[];
  callStack: CallStackFrame[];
}

export interface DebugStartOptions {
  /** The compiled program that is debugged. */
  binaryPath: string;
  workingDirectory: string;
  /** Name of the source file as compiled (used for breakpoint locations). */
  sourceFileName: string;
  breakpoints: number[];
  /** Timeout for a single execution command. */
  timeoutMs?: number;
}

export class DebuggerService {
  private adapter: GDBAdapter | null = null;
  private inspector: VariableInspector | null = null;
  private programOutput = '';
  private stopWaiters: Array<(record: MiRecord) => void> = [];
  private unsubscribe: (() => void) | null = null;

  /** Detects the debugger and reports what it can do. */
  detect(): DebuggerInfo {
    const found = detectDebuggerExecutable();

    if (!found.path) {
      return {
        available: false,
        executablePath: '',
        version: '',
        capabilities: [],
        unavailableReason: 'No GDB executable was found on this system.',
        installHint:
          process.platform === 'win32'
            ? 'Install MSYS2 (https://www.msys2.org) or MinGW-w64 — the debugger usually lives in C:\\msys64\\ucrt64\\bin\\gdb.exe. The debugging panel stays disabled until GDB is available.'
            : 'Install GDB with your package manager, for example "sudo apt install gdb".',
      };
    }

    return {
      available: true,
      executablePath: found.path,
      version: found.version,
      capabilities: [
        'breakpoints',
        'step-over',
        'step-into',
        'step-out',
        'continue',
        'variables',
        'call-stack',
        'program-output',
      ],
    };
  }

  /** Starts a debug session on a compiled program. */
  async start(options: DebugStartOptions): Promise<void> {
    const info = this.detect();
    if (!info.available) {
      throw new Error(info.unavailableReason ?? 'No debugger is available.');
    }

    if (!options.binaryPath || !existsSync(options.binaryPath)) {
      throw new Error('The program to debug could not be found. Compile it first.');
    }

    this.programOutput = '';
    this.adapter = new GDBAdapter({
      executablePath: info.executablePath,
      binaryPath: options.binaryPath,
      workingDirectory: options.workingDirectory,
      commandTimeoutMs: options.timeoutMs ?? 20000,
    });

    this.unsubscribe = this.adapter.onRecord((record) => {
      if (record.kind === 'stream' && typeof record.payload === 'string') {
        this.programOutput += record.payload;
      }
      if (record.kind === 'notify') {
        const reason = miString(record.payload, 'reason');
        if (reason) {
          for (const waiter of this.stopWaiters.splice(0)) {
            waiter(record);
          }
        }
      }
    });

    await this.adapter.start();
    this.inspector = new VariableInspector(this.adapter);

    await this.setBreakpoints(options.breakpoints, options.sourceFileName);
  }

  /** Replaces the set of breakpoints. */
  async setBreakpoints(lines: number[], sourceFileName: string): Promise<void> {
    if (!this.adapter) {
      throw new Error('The debug session is not running.');
    }

    // Remove the existing breakpoints first.
    const existing = await this.adapter.send('-break-delete');
    void existing;

    for (const line of lines) {
      try {
        await this.adapter.send(`-break-insert ${sourceFileName}:${line}`);
      } catch {
        // A breakpoint on a line without code cannot be created — the UI
        // reports the effective set of breakpoints afterwards.
      }
    }
  }

  /** Runs the program until the next stop. */
  async run(): Promise<DebugStop> {
    return this.execute('-exec-run');
  }

  /** Continues execution until the next stop. */
  async resume(): Promise<DebugStop> {
    return this.execute('-exec-continue');
  }

  /** Executes the next statement without entering functions. */
  async stepOver(): Promise<DebugStop> {
    return this.execute('-exec-next');
  }

  /** Executes the next statement, entering functions. */
  async stepInto(): Promise<DebugStop> {
    return this.execute('-exec-step');
  }

  /** Runs until the current function returns. */
  async stepOut(): Promise<DebugStop> {
    return this.execute('-exec-finish');
  }

  private async execute(command: string): Promise<DebugStop> {
    if (!this.adapter) {
      throw new Error('The debug session is not running.');
    }

    const stopPromise = new Promise<MiRecord>((resolve) => {
      this.stopWaiters.push(resolve);
    });

    const result = await this.adapter.send(command);

    // A command that ends the program answers with "done" instead of "running".
    if (result.resultClass === 'done') {
      return this.buildStop('exited', 0, '', '');
    }

    const record = await Promise.race([
      stopPromise,
      new Promise<MiRecord>((resolve) =>
        setTimeout(() => resolve({ kind: 'result', payload: null, raw: '' }), 5000)
      ),
    ]);

    const frame = miObject(record.payload, 'frame') ?? {};
    const reason = miString(record.payload, 'reason') ?? 'stopped';

    return this.buildStop(
      reason,
      Number(miString(frame, 'line') ?? '0'),
      miString(frame, 'func') ?? '',
      miString(frame, 'file') ?? ''
    );
  }

  private async buildStop(
    reason: string,
    line: number,
    functionName: string,
    file: string
  ): Promise<DebugStop> {
    const exited = reason.startsWith('exited');
    const variables = exited || !this.inspector ? [] : await this.inspector.inspect();
    const callStack = exited || !this.inspector ? [] : await this.inspector.callStack();

    return {
      reason,
      file,
      line,
      functionName,
      output: this.programOutput,
      exited,
      variables,
      callStack,
    };
  }

  /** Reads the variables of the current frame. */
  async variables(): Promise<TraceVariable[]> {
    if (!this.inspector) {
      return [];
    }
    return this.inspector.inspect();
  }

  /** Reads the call stack of the current frame. */
  async callStack(): Promise<CallStackFrame[]> {
    if (!this.inspector) {
      return [];
    }
    return this.inspector.callStack();
  }

  /** Reads a numeric array variable of the current frame. */
  async readNumericArray(name: string): Promise<number[] | null> {
    if (!this.inspector) {
      return null;
    }
    return this.inspector.readNumericArray(name);
  }

  /** Program output captured so far. */
  getOutput(): string {
    return this.programOutput;
  }

  /** Ends the debug session and releases the debugger process. */
  async stop(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.stopWaiters = [];
    await this.adapter?.stop();
    this.adapter = null;
    this.inspector = null;
    this.programOutput = '';
  }

  /** True while a debug session is active. */
  get isRunning(): boolean {
    return this.adapter !== null;
  }
}
