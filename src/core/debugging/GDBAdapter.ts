import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';

/**
 * A small client for the GDB/MI (Machine Interface) protocol.
 *
 * Only the subset needed by the playground is implemented: breakpoints,
 * execution control, stack frames and variables. GDB does the real work —
 * this adapter never invents debugging information.
 */

export type MiValue = string | MiValue[] | { [key: string]: MiValue } | null;

export interface MiRecord {
  /** `^` result, `*` notify, `=` notify, `+` status, `~` console stream. */
  kind: 'result' | 'notify' | 'stream' | 'status';
  /** Result class for `^` records: done, running, error, exit. */
  resultClass?: string;
  payload: MiValue;
  raw: string;
}

export interface MiAdapterOptions {
  executablePath: string;
  binaryPath: string;
  workingDirectory: string;
  /** Time after which a command without an answer is rejected. */
  commandTimeoutMs?: number;
}

export class GDBError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GDBError';
  }
}

/**
 * Parses a comma separated list of `key=value` pairs.
 * This is the shape of a MI result payload and of every object value.
 */
function parseResults(input: string, start: number): { value: { [key: string]: MiValue }; next: number } {
  const result: { [key: string]: MiValue } = {};
  let index = start;

  while (index < input.length) {
    while (index < input.length && /[\s,]/.test(input[index])) {
      index += 1;
    }
    if (index >= input.length) {
      break;
    }

    const keyStart = index;
    while (index < input.length && input[index] !== '=' && input[index] !== ',' && input[index] !== '}') {
      index += 1;
    }

    if (input[index] === '}') {
      // The object ended — stop parsing results.
      break;
    }

    if (input[index] !== '=') {
      // A key without a value — skip it defensively.
      index += 1;
      continue;
    }

    const key = input.slice(keyStart, index).trim();
    index += 1; // skip '='
    const parsed = parseValue(input, index);
    if (parsed.next <= index) {
      index += 1;
      continue;
    }
    index = parsed.next;
    if (key.length > 0) {
      result[key] = parsed.value;
    }
  }

  return { value: result, next: index };
}

/** Parses a single MI value at the given position. */
function parseValue(input: string, start: number): { value: MiValue; next: number } {
  if (start >= input.length) {
    return { value: null, next: start };
  }

  const char = input[start];

  if (char === '"') {
    let result = '';
    let index = start + 1;
    while (index < input.length) {
      const current = input[index];
      if (current === '\\') {
        const next = input[index + 1];
        if (next === 'n') {
          result += '\n';
        } else if (next === 't') {
          result += '\t';
        } else if (next === 'r') {
          result += '\r';
        } else if (next === '"') {
          result += '"';
        } else if (next === '\\') {
          result += '\\';
        } else {
          result += next ?? '';
        }
        index += 2;
        continue;
      }
      if (current === '"') {
        index += 1;
        break;
      }
      result += current;
      index += 1;
    }
    return { value: result, next: index };
  }

  if (char === '{') {
    const parsed = parseResults(input, start + 1);
    let next = parsed.next;
    if (input[next] === '}') {
      next += 1;
    }
    return { value: parsed.value, next };
  }

  if (char === '[') {
    const result: MiValue[] = [];
    let index = start + 1;
    while (index < input.length) {
      while (index < input.length && /[\s,]/.test(input[index])) {
        index += 1;
      }
      if (index >= input.length || input[index] === ']') {
        index += 1;
        break;
      }

      // GDB writes named array elements such as `child={...}`. The name is
      // dropped and the value itself is kept.
      let equals = index;
      while (
        equals < input.length &&
        input[equals] !== '=' &&
        input[equals] !== ',' &&
        input[equals] !== ']'
      ) {
        equals += 1;
      }

      const name = input.slice(index, equals);
      const isNamedElement = input[equals] === '=' && /^[A-Za-z0-9_.-]+$/.test(name);

      const parsed = parseValue(input, isNamedElement ? equals + 1 : index);
      if (parsed.next <= index) {
        index += 1;
        continue;
      }
      index = parsed.next;
      result.push(parsed.value);
    }
    return { value: result, next: index };
  }

  // Bare token (numbers, identifiers, c++filt names).
  let index = start;
  while (index < input.length && !/[,}\]]/.test(input[index])) {
    index += 1;
  }
  return { value: input.slice(start, index).trim(), next: index };
}

/** Parses one MI record line. Returns null for non-MI output. */
export function parseMiRecord(line: string): MiRecord | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const prefix = trimmed[0];
  if (!['^', '*', '=', '+', '~', '@'].includes(prefix)) {
    return null;
  }

  if (prefix === '~' || prefix === '@') {
    const parsed = parseValue(trimmed, 1);
    return { kind: 'stream', payload: parsed.value, raw: trimmed };
  }
  const commaIndex = trimmed.indexOf(',');
  const header = commaIndex === -1 ? trimmed.slice(1) : trimmed.slice(1, commaIndex);
  const resultClass = header.trim() || undefined;

  const payloadStart = commaIndex === -1 ? trimmed.length : commaIndex + 1;
  const parsed = parseResults(trimmed, payloadStart);

  if (prefix === '^') {
    return { kind: 'result', resultClass, payload: parsed.value, raw: trimmed };
  }
  if (prefix === '*' || prefix === '=') {
    return { kind: 'notify', payload: parsed.value, raw: trimmed };
  }
  return { kind: 'status', payload: parsed.value, raw: trimmed };
}

type RecordListener = (record: MiRecord) => void;

export class GDBAdapter {
  private child: ChildProcessWithoutNullStreams | null = null;
  private buffer = '';
  private pending: Array<(record: MiRecord) => void> = [];
  private listeners: RecordListener[] = [];
  private commandTimeoutMs: number;
  private closed = false;

  constructor(private readonly options: MiAdapterOptions) {
    this.commandTimeoutMs = options.commandTimeoutMs ?? 15000;
  }

  /** Starts GDB with the compiled program loaded (but not running). */
  async start(): Promise<void> {
    const child = spawn(
      this.options.executablePath,
      ['--interpreter=mi2', '--quiet', '--nx', this.options.binaryPath],
      {
        cwd: this.options.workingDirectory,
        shell: false,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    ) as ChildProcessWithoutNullStreams;

    this.child = child;

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => this.consume(chunk));
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', () => {
      // GDB writes its own noise to stderr; it is not part of the protocol.
    });
    child.on('close', () => {
      this.closed = true;
      this.flushPending(new Error('The debugger session ended.'));
    });

    // Wait for the initial prompt record so the session is really ready.
    await this.send('-gdb-set confirm off');
  }

  private consume(chunk: string): void {
    this.buffer += chunk;
    let newlineIndex = this.buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = this.buffer.slice(0, newlineIndex).replace(/\r$/, '');
      this.buffer = this.buffer.slice(newlineIndex + 1);
      this.handleLine(line);
      newlineIndex = this.buffer.indexOf('\n');
    }
  }

  private handleLine(line: string): void {
    const record = parseMiRecord(line);
    if (!record) {
      return;
    }

    for (const listener of this.listeners) {
      listener(record);
    }

    if (record.kind === 'result') {
      const resolver = this.pending.shift();
      resolver?.(record);
    }
  }

  /** Registers a listener for every record (notifications included). */
  onRecord(listener: RecordListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((entry) => entry !== listener);
    };
  }

  /** Sends a MI command and waits for its result record. */
  async send(command: string): Promise<MiRecord> {
    if (!this.child || this.closed) {
      throw new GDBError('The debugger session is not running.');
    }

    return new Promise<MiRecord>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new GDBError(`The debugger did not answer "${command}" in time.`));
      }, this.commandTimeoutMs);

      this.pending.push((record) => {
        clearTimeout(timer);
        if (record.resultClass === 'error') {
          const message =
            (record.payload as { msg?: MiValue } | null)?.msg ??
            'The debugger rejected the command.';
          reject(new GDBError(String(message)));
          return;
        }
        resolve(record);
      });

      this.child?.stdin.write(`${command}\n`);
    });
  }

  private flushPending(error: Error): void {
    const pending = this.pending;
    this.pending = [];
    for (const resolver of pending) {
      resolver({ kind: 'result', resultClass: 'error', payload: { msg: error.message }, raw: '' });
    }
  }

  /** Terminates the debugger session. */
  async stop(): Promise<void> {
    if (!this.child) {
      return;
    }

    try {
      this.child.stdin.write('-gdb-exit\n');
    } catch {
      // The process may already be gone.
    }

    this.closed = true;

    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        try {
          this.child?.kill('SIGKILL');
        } catch {
          // Ignore.
        }
        resolve();
      }, 2000);

      this.child?.once('close', () => {
        clearTimeout(timer);
        resolve();
      });
    });

    this.child = null;
  }
}

/** Reads a string field from an MI payload. */
export function miString(payload: MiValue, key: string): string | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return undefined;
  }
  const value = payload[key];
  return typeof value === 'string' ? value : undefined;
}

/** Reads a nested object field from an MI payload. */
export function miObject(payload: MiValue, key: string): { [key: string]: MiValue } | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return undefined;
  }
  const value = payload[key];
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return undefined;
}

/** Reads an array field from an MI payload. */
export function miArray(payload: MiValue, key: string): MiValue[] | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return undefined;
  }
  const value = payload[key];
  return Array.isArray(value) ? value : undefined;
}
