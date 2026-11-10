import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { GDBAdapter, parseMiRecord, miString, miObject, miArray } from '../../../src/core/debugging/GDBAdapter';

const SOURCE = `#include <stdio.h>

int sum(int n) {
    int total = 0;
    for (int i = 1; i <= n; i++) {
        total += i;
    }
    return total;
}

int main(void) {
    int arr[5] = {10, 20, 30, 40, 50};
    int result = sum(3);
    printf("%d\\n", result);
    return 0;
}
`;

describe('MI record parsing', () => {
  it('parses a result record', () => {
    const record = parseMiRecord('^done,reason="breakpoint-hit",frame={addr="0x1",func="main",line="12"}');
    expect(record?.kind).toBe('result');
    expect(record?.resultClass).toBe('done');
    expect(miString(record?.payload ?? null, 'reason')).toBe('breakpoint-hit');
    expect(miString(miObject(record?.payload ?? null, 'frame'), 'func')).toBe('main');
  });

  it('parses a stop notification', () => {
    const record = parseMiRecord('*stopped,reason="end-stepping-range",frame={level="0",func="main",line="8"},threadId="1"');
    expect(record?.kind).toBe('notify');
    expect(miString(record?.payload ?? null, 'reason')).toBe('end-stepping-range');
  });

  it('parses a variables result', () => {
    const record = parseMiRecord(
      '^done,variables=[{name="i",value="0"},{name="total",value="0"}],frame={level="0"}'
    );
    const variables = miArray(record?.payload ?? null, 'variables');
    expect(variables).toHaveLength(2);
    expect(miString(variables?.[0] as never, 'name')).toBe('i');
  });

  it('parses console stream output', () => {
    const record = parseMiRecord('~"hello\\n"');
    expect(record?.kind).toBe('stream');
    expect(record?.payload).toBe('hello\n');
  });

  it('ignores plain text', () => {
    expect(parseMiRecord('Reading symbols from prog.exe...')).toBeNull();
  });
});

describe('GDB adapter (real debugger)', () => {
  const gdbPath = 'C:\\Strawberry\\c\\bin\\gdb.exe';

  it('compiles, sets a breakpoint, steps and inspects variables', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'daa-gdb-test-'));
    const sourcePath = path.join(dir, 'program.c');
    const binaryPath = path.join(dir, 'program.exe');
    fs.writeFileSync(sourcePath, SOURCE, 'utf8');

    const compiled = spawnSync(gdbPath, ['--version'], { encoding: 'utf8' });
    expect(compiled.status).toBe(0);

    const gcc = spawnSync(
      'C:\\Strawberry\\c\\bin\\gcc.exe',
      ['-std=c11', '-g', '-O0', '-o', binaryPath, sourcePath],
      { encoding: 'utf8' }
    );
    expect(gcc.stderr).toBe('');
    expect(gcc.status).toBe(0);

    const adapter = new GDBAdapter({
      executablePath: gdbPath,
      binaryPath,
      workingDirectory: dir,
    });

    const stops: string[] = [];
    adapter.onRecord((record) => {
      if (record.kind === 'notify' && miString(record.payload, 'reason')) {
        stops.push(miString(record.payload, 'reason') as string);
      }
    });

    await adapter.start();

    const breakpoint = await adapter.send('-break-insert program.c:14');
    expect(breakpoint.resultClass).toBe('done');
    expect(miObject(breakpoint.payload, 'bkpt')).toBeDefined();

    const run = await adapter.send('-exec-run');
    expect(run.resultClass).toBe('running');

    // Wait for the stop notification.
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const frames = await adapter.send('-stack-list-frames');
    const stack = miArray(frames.payload, 'stack');
    expect(stack?.length).toBeGreaterThan(0);

    const variables = await adapter.send('-stack-list-variables --all-values');
    const vars = miArray(variables.payload, 'variables');
    expect(vars?.length).toBeGreaterThan(0);

    const names = vars?.map((v) => miString(v as never, 'name'));
    expect(names).toContain('arr');
    expect(names).toContain('result');

    const arrayVariable = vars?.find((v) => miString(v as never, 'name') === 'arr');
    const arrayValue = miString(arrayVariable as never, 'value') ?? '';
    expect(arrayValue).toContain('10');
    expect(arrayValue).toContain('50');

    await adapter.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }, 30000);
});
