import { GDBAdapter, miArray, miObject, miString } from './GDBAdapter';
import type { MiValue } from './GDBAdapter';
import type { CallStackFrame, TraceVariable } from '../playground/types';

/**
 * Turns raw debugger information into the variable tree shown in the UI.
 *
 * Every value shown here comes from the debugger — nothing is guessed. When
 * the debugger cannot resolve a value the entry is marked as unavailable.
 */

const MAX_DEPTH = 2;
const MAX_CHILDREN = 64;

export class VariableInspector {
  constructor(private readonly adapter: GDBAdapter) {}

  /**
   * Reads the variables of the current stack frame.
   * Simple variables carry their type; aggregates are expanded one level
   * deeper so arrays and structures are inspectable.
   */
  async inspect(scope = 0): Promise<TraceVariable[]> {
    const listed = await this.adapter.send('-stack-list-variables --all-values');
    const raw = miArray(listed.payload, 'variables') ?? [];

    const variables: TraceVariable[] = [];
    for (const entry of raw) {
      const name = miString(entry as MiValue, 'name');
      if (!name) {
        continue;
      }
      const value = miString(entry as MiValue, 'value') ?? '';
      variables.push({
        name,
        type: 'unknown',
        value,
        scope: scope === 0 ? 'local' : 'block',
      });
    }

    // Ask GDB for the real type of every variable (cheap: one MI round trip).
    for (const variable of variables) {
      try {
        const created = await this.adapter.send(`-var-create - * ${variable.name}`);
        const type = miString(created.payload, 'type');
        if (type) {
          variable.type = type;
        }
        const numChild = Number(miString(created.payload, 'numchild') ?? '0');
        if (numChild > 0) {
          const children = await this.listChildren(
            miString(created.payload, 'name') ?? variable.name,
            1
          );
          variable.children = children;
          // GDB reports only "[5]" as the value of an array — the readable
          // summary is built from the children instead.
          variable.value = children.length > 0 ? this.summarize(children) : variable.value;
        }
      } catch {
        // Keep the value-only entry when GDB cannot create a variable object.
        variable.type = 'unknown';
      }
    }

    return variables;
  }

  /** Lists the children of an aggregate variable (array elements, members). */
  private async listChildren(varName: string, depth: number): Promise<TraceVariable[]> {
    if (depth > MAX_DEPTH) {
      return [];
    }

    let listed;
    try {
      // --all-values makes GDB report the value of every child as well.
      listed = await this.adapter.send(`-var-list-children --all-values ${varName}`);
    } catch {
      try {
        listed = await this.adapter.send(`-var-list-children ${varName}`);
      } catch {
        return [];
      }
    }

    const raw = miArray(listed.payload, 'children') ?? [];
    const children: TraceVariable[] = [];

    for (const entry of raw.slice(0, MAX_CHILDREN)) {
      const name = miString(entry as MiValue, 'name') ?? '';
      const value = miString(entry as MiValue, 'value') ?? '';
      const type = miString(entry as MiValue, 'type') ?? 'unknown';
      const child: TraceVariable = {
        name: name.split('.').pop() ?? name,
        type,
        value,
        scope: 'child',
      };

      const numChild = Number(miString(entry as MiValue, 'numchild') ?? '0');
      if (numChild > 0 && depth < MAX_DEPTH) {
        child.children = await this.listChildren(name, depth + 1);
      }

      children.push(child);
    }

    return children;
  }

  /** Builds a readable summary of an aggregate from its children. */
  private summarize(children: TraceVariable[]): string {
    const parts = children.map((child) => child.value || '?');
    return `{${parts.join(', ')}}`;
  }

  /** Reads the call stack of the current thread. */
  async callStack(): Promise<CallStackFrame[]> {
    const listed = await this.adapter.send('-stack-list-frames');
    const stack = miArray(listed.payload, 'stack') ?? [];

    return stack.map((entry, index) => {
      // GDB writes `stack=[frame={...}]`; some versions nest the frame again.
      const frame = miObject(entry as MiValue, 'frame') ?? (entry as { [key: string]: MiValue });
      return {
        level: Number(miString(frame, 'level') ?? index),
        functionName: miString(frame, 'func') ?? 'unknown',
        file: miString(frame, 'file') ?? '',
        line: Number(miString(frame, 'line') ?? '0'),
        address: miString(frame, 'addr'),
      };
    });
  }

  /**
   * Extracts the numeric elements of an array variable.
   * Returns null when the variable is not an array of numbers.
   */
  async readNumericArray(variableName: string, maxLength = 256): Promise<number[] | null> {
    let created;
    try {
      created = await this.adapter.send(`-var-create - * ${variableName}`);
    } catch {
      return null;
    }

    const type = miString(created.payload, 'type') ?? '';
    if (!/\[\s*\d*\s*\]/.test(type)) {
      return null;
    }

    const children = await this.listChildren(miString(created.payload, 'name') ?? variableName, 1);
    const values: number[] = [];

    for (const child of children.slice(0, maxLength)) {
      const parsed = Number(child.value);
      if (!Number.isFinite(parsed)) {
        return null;
      }
      values.push(parsed);
    }

    return values.length > 0 ? values : null;
  }}
