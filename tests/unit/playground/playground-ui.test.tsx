import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CodePlaygroundPage } from '../../../src/webview/pages/CodePlaygroundPage';
import { CodeEditor } from '../../../src/webview/components/playground/CodeEditor';
import { CompilerStatus } from '../../../src/webview/components/playground/CompilerStatus';
import { ExecutionToolbar } from '../../../src/webview/components/playground/ExecutionToolbar';
import { ConsolePanel } from '../../../src/webview/components/playground/ConsolePanel';
import { InputPanel } from '../../../src/webview/components/playground/InputPanel';
import { DiagnosticsPanel } from '../../../src/webview/components/playground/DiagnosticsPanel';
import { DebugControls } from '../../../src/webview/components/debugging/DebugControls';
import { VariableInspector } from '../../../src/webview/components/debugging/VariableInspector';
import { CallStackPanel } from '../../../src/webview/components/debugging/CallStackPanel';
import { ExecutionTracePanel } from '../../../src/webview/components/execution/ExecutionTracePanel';
import { TestCaseManager } from '../../../src/webview/components/testing/TestCaseManager';
import { TestResultsPanel } from '../../../src/webview/components/testing/TestResultsPanel';
import { tokenizeC } from '../../../src/webview/components/playground/cSyntax';
import type {
  CompileDiagnostic,
  DebugSessionState,
  ExecutionResult,
} from '../../../src/core/playground/types';

const render = (element: JSX.Element): string => renderToStaticMarkup(element);

const DEBUG_STATE: DebugSessionState = {
  status: 'paused',
  currentLine: 12,
  currentFunction: 'main',
  breakpoints: [12],
  variables: [
    { name: 'i', type: 'int', value: '3', scope: 'local' },
    {
      name: 'arr',
      type: 'int [5]',
      value: '{5, 3, 8, 2, 1}',
      scope: 'local',
      children: [{ name: '0', type: 'int', value: '5', scope: 'child' }],
    },
  ],
  callStack: [{ level: 0, functionName: 'main', file: 'program.c', line: 12 }],
  traceEvents: [
    {
      id: 0,
      sequence: 0,
      type: 'condition',
      file: 'program.c',
      line: 12,
      description: 'Line 12: the program compared two values.',
      variables: [],
      arrayValues: [5, 3, 8, 2, 1],
      arrayName: 'arr',
      timestamp: Date.now(),
    },
  ],
  counters: { comparisons: 4, swaps: 1, iterations: 6, reliable: true, note: 'derived from the source' },
};

describe('C tokenizer', () => {
  it('recognises keywords, types, strings and comments', () => {
    const tokens = tokenizeC('int x = 42; // note\nwhile (x) { char *s = "hi"; }');

    expect(tokens.some((token) => token.type === 'keyword' && token.text === 'while')).toBe(true);
    expect(tokens.some((token) => token.type === 'type' && token.text === 'int')).toBe(true);
    expect(tokens.some((token) => token.type === 'type' && token.text === 'char')).toBe(true);
    expect(tokens.some((token) => token.type === 'number' && token.text === '42')).toBe(true);
    expect(tokens.some((token) => token.type === 'comment')).toBe(true);
    expect(tokens.some((token) => token.type === 'string' && token.text === '"hi"')).toBe(true);
  });

  it('never loses characters', () => {
    const source = 'int main(void){ return 0; }\n';
    const rebuilt = tokenizeC(source)
      .map((token) => token.text)
      .join('');
    expect(rebuilt).toBe(source);
  });
});

describe('playground components render', () => {
  it('renders the code editor with line numbers', () => {
    const markup = render(
      <CodeEditor value={'int a;\nint b;\n'} onChange={() => undefined} breakpoints={[2]} currentLine={1} />
    );

    expect(markup).toContain('int a;');
    expect(markup.length).toBeGreaterThan(100);
  });

  it('renders the compiler status for a missing compiler', () => {
    const markup = render(
      <CompilerStatus
        compiler={{
          id: 'gcc',
          name: 'GCC',
          executablePath: '',
          version: '',
          available: false,
          verified: false,
          supportedStandards: ['c11'],
          platform: 'win32',
          detectedAt: Date.now(),
          unavailableReason: 'No GCC executable was found on this system.',
          installHint: 'Install MSYS2.',
        }}
        onRefresh={() => undefined}
      />
    );

    expect(markup).toContain('No C compiler');
    expect(markup).toContain('Install MSYS2.');
  });

  it('renders the toolbar with disabled controls', () => {
    const markup = render(
      <ExecutionToolbar
        onCompile={() => undefined}
        onRun={() => undefined}
        onStop={() => undefined}
        onDebug={() => undefined}
        onStopDebug={() => undefined}
        isRunning={false}
        isDebugging={false}
        canRun={false}
        canDebug={false}
      />
    );

    expect(markup).toContain('Run');
    expect(markup).toContain('disabled');
  });

  it('renders the console with the execution status', () => {
    const result: ExecutionResult = {
      id: 'r1',
      programId: 'p',
      status: 'success',
      stdout: 'hello',
      stderr: '',
      exitCode: 0,
      durationMs: 12,
      startedAt: 0,
      completedAt: 12,
      outputTruncated: false,
      diagnostics: [],
    };

    const markup = render(<ConsolePanel result={result} onClear={() => undefined} />);
    expect(markup).toContain('hello');
    expect(markup).toContain('Finished successfully');
  });

  it('renders the input panel', () => {
    const markup = render(
      <InputPanel
        value={'5\n'}
        onChange={() => undefined}
        presets={[{ name: 'preset', value: '1\n' }]}
        onUsePreset={() => undefined}
        onClear={() => undefined}
      />
    );

    expect(markup).toContain('Standard input');
    expect(markup).toContain('preset');
  });

  it('renders diagnostics with the explanation', () => {
    const diagnostic: CompileDiagnostic = {
      id: 'd1',
      severity: 'error',
      file: 'program.c',
      line: 4,
      column: 9,
      message: "expected ';' before 'return'",
      category: 'missing-semicolon',
      explanation: 'The compiler expected a semicolon.',
      suggestion: 'Add the missing semicolon.',
      sourceLine: 'int x = 5',
    };

    const markup = render(
      <DiagnosticsPanel diagnostics={[diagnostic]} onSelect={() => undefined} activeLine={4} />
    );

    expect(markup).toContain('Missing semicolon');
    expect(markup).toContain('program.c:4:9');
    expect(markup).toContain('Add the missing semicolon.');
  });

  it('renders the debug controls', () => {
    const markup = render(
      <DebugControls
        state={DEBUG_STATE}
        onStart={() => undefined}
        onContinue={() => undefined}
        onStepOver={() => undefined}
        onStepInto={() => undefined}
        onStepOut={() => undefined}
        onStop={() => undefined}
        debuggerAvailable
      />
    );

    expect(markup).toContain('Step Over');
    expect(markup).toContain('Paused at line 12');
  });

  it('explains that debugging is unavailable without a debugger', () => {
    const markup = render(
      <DebugControls
        state={DEBUG_STATE}
        onStart={() => undefined}
        onContinue={() => undefined}
        onStepOver={() => undefined}
        onStepInto={() => undefined}
        onStepOut={() => undefined}
        onStop={() => undefined}
        debuggerAvailable={false}
      />
    );

    expect(markup).toContain('No GDB debugger was found');
  });

  it('renders the variable inspector and the call stack', () => {
    const variables = render(<VariableInspector variables={DEBUG_STATE.variables} />);
    expect(variables).toContain('arr');
    expect(variables).toContain('int [5]');

    const stack = render(<CallStackPanel frames={DEBUG_STATE.callStack} />);
    expect(stack).toContain('main()');
    expect(stack).toContain('program.c:12');
  });

  it('renders the execution trace panel', () => {
    const markup = render(<ExecutionTracePanel state={DEBUG_STATE} events={DEBUG_STATE.traceEvents} />);
    expect(markup).toContain('Live array state');
    expect(markup).toContain('Comparisons');
  });

  it('renders the test case manager and the results', () => {
    const manager = render(
      <TestCaseManager testCases={[]} onChange={() => undefined} onRunAll={() => undefined} />
    );
    expect(manager).toContain('New test case');

    const results = render(
      <TestResultsPanel
        summary={{
          passed: 1,
          failed: 0,
          errored: 0,
          total: 1,
          durationMs: 20,
          results: [
            {
              testCaseId: 't1',
              name: 'first',
              status: 'passed',
              expectedOutput: 'ok',
              actualOutput: 'ok',
              exitCode: 0,
              durationMs: 20,
              detail: null,
              diff: null,
            },
          ],
        }}
      />
    );
    expect(results).toContain('Passed');
  });

  it('renders the whole playground page', () => {
    const markup = render(<CodePlaygroundPage algorithmId="bubble-sort" onBack={() => undefined} />);
    expect(markup).toContain('Code Playground');
    expect(markup).toContain('Checking for a local C compiler');
  });
});
