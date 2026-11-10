import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import { postToExtension, onExtensionMessage } from '../utils';
import { PLAYGROUND_MESSAGES } from '../../shared/constants';
import { CodeEditor } from '../components/playground/CodeEditor';
import { CompilerStatus } from '../components/playground/CompilerStatus';
import { ExecutionToolbar } from '../components/playground/ExecutionToolbar';
import { ConsolePanel } from '../components/playground/ConsolePanel';
import { InputPanel } from '../components/playground/InputPanel';
import { DiagnosticsPanel } from '../components/playground/DiagnosticsPanel';
import { DebugControls } from '../components/debugging/DebugControls';
import { VariableInspector } from '../components/debugging/VariableInspector';
import { CallStackPanel } from '../components/debugging/CallStackPanel';
import { ExecutionTracePanel } from '../components/execution/ExecutionTracePanel';
import { TestCaseManager } from '../components/testing/TestCaseManager';
import { TestResultsPanel } from '../components/testing/TestResultsPanel';
import { PROGRAM_TEMPLATES, getTemplate } from '../../core/playground/templates';
import { getReferenceImplementation } from '../../core/playground/referenceImplementations';
import { getAlgorithmById } from '../../core/algorithms';
import type {
  CompileDiagnostic,
  CompilerInfo,
  DebuggerInfo,
  DebugSessionState,
  ExecutionConfig,
  ExecutionResult,
  TestCase,
  TestRunSummary,
  TraceEvent,
} from '../../core/playground/types';

type PlaygroundTab = 'code' | 'debug' | 'tests' | 'reference' | 'history';

interface CodePlaygroundProps {
  /** Algorithm the playground was opened for (optional). */
  algorithmId?: string;
  onBack: () => void;
}

const INPUT_PRESETS = [
  { name: '5 numbers', value: '5\n5 4 3 2 1\n' },
  { name: '3 numbers', value: '3\n10 20 30\n' },
  { name: 'single number', value: '42\n' },
  { name: 'empty', value: '' },
];

const DEFAULT_SOURCE = `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int arr[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");

    return 0;
}
`;

const EMPTY_DEBUG_STATE: DebugSessionState = {
  status: 'idle',
  breakpoints: [],
  variables: [],
  callStack: [],
  traceEvents: [],
  counters: { comparisons: 0, swaps: 0, iterations: 0, reliable: false, note: '' },
};

/**
 * The Code Playground.
 *
 * Everything that compiles, runs or debugs a program happens in the extension
 * host; this page only renders the state and sends the requests.
 */
export const CodePlaygroundPage: FunctionComponent<CodePlaygroundProps> = ({
  algorithmId,
  onBack,
}) => {
  const [tab, setTab] = useState<PlaygroundTab>('code');
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [savedSource, setSavedSource] = useState(DEFAULT_SOURCE);
  const [programId, setProgramId] = useState('program-scratch');
  const [programName, setProgramName] = useState('Scratch program');
  const [stdin, setStdin] = useState('5\n5 4 3 2 1\n');
  const [linkedAlgorithmId, setLinkedAlgorithmId] = useState<string | undefined>(algorithmId);

  const [compiler, setCompiler] = useState<CompilerInfo | null>(null);
  const [debuggerInfo, setDebuggerInfo] = useState<DebuggerInfo | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<CompileDiagnostic[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);

  const [debugState, setDebugState] = useState<DebugSessionState>(EMPTY_DEBUG_STATE);
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testSummary, setTestSummary] = useState<TestRunSummary | null>(null);

  const [programs, setPrograms] = useState<
    Array<{ id: string; name: string; filePath: string; algorithmId?: string; updatedAt: number }>
  >([]);
  const [history, setHistory] = useState<
    Array<{
      id: string;
      programName: string;
      executedAt: number;
      status: string;
      stdout: string;
      stderr: string;
      exitCode: number | null;
      durationMs: number;
    }>
  >([]);

  const [executionConfig, setExecutionConfig] = useState<ExecutionConfig>({
    language: 'c',
    standard: 'c11',
    optimization: 'O0',
    timeoutMs: 5000,
    maxOutputBytes: 256 * 1024,
    debugSymbols: true,
  });

  const reference = useMemo(
    () => (linkedAlgorithmId ? getReferenceImplementation(linkedAlgorithmId) : null),
    [linkedAlgorithmId]
  );

  // Ask the host for the compiler status as soon as the page is opened.
  useEffect(() => {
    postToExtension({ type: PLAYGROUND_MESSAGES.GET_COMPILER_STATUS });
    postToExtension({ type: PLAYGROUND_MESSAGES.LIST_PROGRAMS });
    postToExtension({ type: PLAYGROUND_MESSAGES.GET_HISTORY });
  }, []);

  useEffect(() => {
    const unsubscribe = onExtensionMessage((event) => {
      const message = event.data as { type: string; payload?: unknown };
      const payload = (message.payload ?? {}) as Record<string, unknown>;

      switch (message.type) {
      case PLAYGROUND_MESSAGES.COMPILER_STATUS: {
        setCompiler(payload.info as CompilerInfo);
        setDebuggerInfo((payload.debugger as DebuggerInfo) ?? null);
        break;
      }
      case PLAYGROUND_MESSAGES.COMPILE_RESULT: {
        setDiagnostics((payload.diagnostics as CompileDiagnostic[]) ?? []);
        setIsCompiling(false);
        break;
      }
      case PLAYGROUND_MESSAGES.EXECUTION_RESULT: {
        const result = payload as unknown as ExecutionResult;
        setExecutionResult(result);
        setDiagnostics(result.diagnostics ?? []);
        setIsRunning(false);
        break;
      }
      case PLAYGROUND_MESSAGES.TEST_RESULT: {
        setTestSummary(payload as unknown as TestRunSummary);
        break;
      }
      case PLAYGROUND_MESSAGES.PROGRAMS_LIST: {
        setPrograms((payload.programs as typeof programs) ?? []);
        break;
      }
      case PLAYGROUND_MESSAGES.PROGRAM_SAVED: {
        if (typeof payload.source === 'string') {
          setSource(payload.source);
          setSavedSource(payload.source);
        }
        if (Array.isArray(payload.testCases)) {
          setTestCases(payload.testCases as TestCase[]);
        }
        break;
      }
      case PLAYGROUND_MESSAGES.TEST_CASES_LOADED: {
        setTestCases((payload.testCases as TestCase[]) ?? []);
        break;
      }
      case PLAYGROUND_MESSAGES.HISTORY_LOADED: {
        setHistory((payload.entries as typeof history) ?? []);
        break;
      }
      case PLAYGROUND_MESSAGES.DEBUG_STATE_CHANGED: {
        const state = payload as unknown as DebugSessionState;
        setDebugState(state);
        setTraceEvents(state.traceEvents ?? []);
        break;
      }
      case PLAYGROUND_MESSAGES.TRACE_EVENT_RECEIVED: {
        const event = payload as unknown as TraceEvent;
        setTraceEvents((previous) => [...previous, event].slice(-200));
        break;
      }
      default:
        break;
      }
    });

    return unsubscribe;
  }, []);

  const handleCompile = useCallback(() => {
    setIsCompiling(true);
    postToExtension({
      type: PLAYGROUND_MESSAGES.COMPILE_PROGRAM,
      payload: { source, executionConfig },
    });
  }, [source, executionConfig]);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setExecutionResult(null);
    postToExtension({
      type: PLAYGROUND_MESSAGES.RUN_PROGRAM,
      payload: { programId, source, stdin, executionConfig },
    });
  }, [programId, source, stdin, executionConfig]);

  const handleStop = useCallback(() => {
    postToExtension({ type: PLAYGROUND_MESSAGES.STOP_PROGRAM });
  }, []);

  const handleRestart = useCallback(() => {
    // Stop a running program first, then start it again from the top.
    postToExtension({ type: PLAYGROUND_MESSAGES.STOP_PROGRAM });
    handleRun();
  }, [handleRun]);

  const handleStartDebugging = useCallback(() => {
    setTraceEvents([]);
    postToExtension({
      type: PLAYGROUND_MESSAGES.START_DEBUGGING,
      payload: {
        source,
        algorithmId: linkedAlgorithmId ?? null,
        breakpoints,
        executionConfig,
      },
    });
    setTab('debug');
  }, [source, linkedAlgorithmId, breakpoints, executionConfig]);

  const handleDebugAction = useCallback((action: 'continue' | 'over' | 'into' | 'out') => {
    postToExtension({ type: PLAYGROUND_MESSAGES.DEBUG_ACTION, payload: { action } });
  }, []);

  const handleStopDebugging = useCallback(() => {
    postToExtension({ type: PLAYGROUND_MESSAGES.STOP_DEBUGGING });
  }, []);

  const handleRestartDebugging = useCallback(() => {
    // Restart the program from the first line with the same breakpoints.
    postToExtension({ type: PLAYGROUND_MESSAGES.STOP_DEBUGGING });
    handleStartDebugging();
  }, [handleStartDebugging]);

  const handleRunTests = useCallback(() => {
    postToExtension({
      type: PLAYGROUND_MESSAGES.RUN_TESTS,
      payload: { source, testCases, executionConfig },
    });
  }, [source, testCases, executionConfig]);

  const handleSave = useCallback(() => {
    postToExtension({
      type: PLAYGROUND_MESSAGES.SAVE_PROGRAM,
      payload: { programId, name: programName, source, algorithmId: linkedAlgorithmId },
    });
    postToExtension({
      type: PLAYGROUND_MESSAGES.SAVE_TEST_CASES,
      payload: { programId, testCases },
    });
    setSavedSource(source);
  }, [programId, programName, source, linkedAlgorithmId, testCases]);

  const handleLoad = useCallback((id: string) => {
    postToExtension({ type: PLAYGROUND_MESSAGES.LOAD_PROGRAM, payload: { programId: id } });
  }, []);

  const handleOpenInEditor = useCallback(() => {
    postToExtension({ type: PLAYGROUND_MESSAGES.OPEN_PROGRAM_FILE, payload: { programId } });
  }, [programId]);

  const handleDelete = useCallback((id: string) => {
    postToExtension({ type: PLAYGROUND_MESSAGES.DELETE_PROGRAM, payload: { programId: id } });
  }, []);

  const toggleBreakpoint = useCallback((line: number) => {
    setBreakpoints((previous) =>
      previous.includes(line) ? previous.filter((entry) => entry !== line) : [...previous, line].sort((a, b) => a - b)
    );
  }, []);

  const handleSelectDiagnostic = useCallback((diagnostic: CompileDiagnostic) => {
    if (diagnostic.line > 0) {
      setTab('code');
    }
  }, []);

  const canRun = compiler?.available === true && compiler.verified;
  const canDebug = canRun && debuggerInfo?.available === true;
  const hasUnsavedChanges = source !== savedSource;

  const editorMarkers = useMemo(
    () =>
      diagnostics
        .filter((diagnostic) => diagnostic.line > 0)
        .map((diagnostic) => ({
          line: diagnostic.line,
          severity: diagnostic.severity === 'error' ? ('error' as const) : ('warning' as const),
        })),
    [diagnostics]
  );

  const TABS: Array<{ id: PlaygroundTab; label: string }> = [
    { id: 'code', label: 'Code' },
    { id: 'debug', label: 'Debug' },
    { id: 'tests', label: 'Tests' },
    { id: 'reference', label: 'Reference' },
    { id: 'history', label: 'History' },
  ];

  return (
    <Box style={{ padding: SPACING.lg }}>
      <Flex gap={SPACING.md} align="center" justify="between" style={{ marginBottom: SPACING.lg, flexWrap: 'wrap' } as React.CSSProperties}>
        <Box>
          <Text as="h1" style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: 0 }}>
            Code Playground
          </Text>
          <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: '0.25rem 0 0 0' }}>
            Write, compile, run and debug your own C implementation. The program is compiled and executed locally with
            your GCC toolchain.
          </Text>
        </Box>
        <Flex gap={SPACING.sm} align="center">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button variant="ghost" onClick={handleOpenInEditor}>
            Open in editor
          </Button>
          <Button variant="secondary" onClick={handleSave}>
            Save program
          </Button>
        </Flex>
      </Flex>

      <Box
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          marginBottom: SPACING.lg,
        }}
      >
        <Flex gap={SPACING.lg} align="center" style={{ flexWrap: 'wrap' } as React.CSSProperties}>
          <ExecutionToolbar
            onCompile={handleCompile}
            onRun={handleRun}
            onStop={handleStop}
            onRestart={handleRestart}
            onDebug={handleStartDebugging}
            onStopDebug={handleStopDebugging}
            isRunning={isRunning || isCompiling}
            isDebugging={debugState.status === 'paused' || debugState.status === 'running'}
            canRun={canRun}
            canDebug={canDebug}
          />
          <span style={{ flex: 1 }} />
          <CompilerStatus
            compiler={compiler}
            debuggerInfo={debuggerInfo}
            onRefresh={() => postToExtension({ type: PLAYGROUND_MESSAGES.REFRESH_COMPILER })}
          />
        </Flex>
      </Box>

      <Flex gap={SPACING.sm} style={{ marginBottom: SPACING.lg, flexWrap: 'wrap' } as React.CSSProperties}>
        {TABS.map((entry) => (
          <Button
            key={entry.id}
            variant={tab === entry.id ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </Button>
        ))}
      </Flex>

      {tab === 'code' && (
        <Box style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: SPACING.lg, alignItems: 'start' } as React.CSSProperties}>
          <Box style={{ display: 'grid', gap: SPACING.md }}>
            <Flex gap={SPACING.sm} align="center" style={{ flexWrap: 'wrap' } as React.CSSProperties}>
              <select
                value=""
                onChange={(event) => {
                  const template = getTemplate(event.target.value);
                  if (template) {
                    setSource(template.source);
                    if (template.algorithmId) {
                      setLinkedAlgorithmId(template.algorithmId);
                    }
                  }
                }}
                style={{
                  padding: '0.35rem 0.5rem',
                  backgroundColor: COLORS.surfaceElevated,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.sm,
                  color: COLORS.textPrimary,
                  fontSize: '0.8rem',
                }}
              >
                <option value="">Insert a template…</option>
                {PROGRAM_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>

              <select
                value={linkedAlgorithmId ?? ''}
                onChange={(event) => setLinkedAlgorithmId(event.target.value || undefined)}
                style={{
                  padding: '0.35rem 0.5rem',
                  backgroundColor: COLORS.surfaceElevated,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.sm,
                  color: COLORS.textPrimary,
                  fontSize: '0.8rem',
                }}
              >
                <option value="">No linked algorithm</option>
                {['bubble-sort', 'selection-sort', 'insertion-sort', 'merge-sort', 'quick-sort', 'linear-search', 'binary-search'].map((id) => (
                  <option key={id} value={id}>
                    {getAlgorithmById(id)?.name ?? id}
                  </option>
                ))}
              </select>

              <span style={{ flex: 1 }} />
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
                {source.split('\n').length} lines · click a line number to toggle a breakpoint
              </Text>
            </Flex>

            <CodeEditor
              value={source}
              onChange={setSource}
              breakpoints={breakpoints}
              markers={editorMarkers}
              currentLine={debugState.currentLine}
              onToggleBreakpoint={toggleBreakpoint}
            />

            <ConsolePanel
              result={executionResult}
              debugOutput={traceEvents.length > 0 ? '' : undefined}
              onClear={() => {
                setExecutionResult(null);
                setDiagnostics([]);
              }}
            />

            <Box style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: SPACING.md } as React.CSSProperties}>
              <InputPanel
                value={stdin}
                onChange={setStdin}
                presets={INPUT_PRESETS}
                onUsePreset={setStdin}
                onClear={() => setStdin('')}
              />
              <Box
                style={{
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.md,
                  padding: SPACING.md,
                }}
              >
                <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
                  Compiler diagnostics
                </Text>
                <DiagnosticsPanel
                  diagnostics={diagnostics}
                  onSelect={handleSelectDiagnostic}
                  activeLine={undefined}
                />
              </Box>
            </Box>
          </Box>

          <Box style={{ display: 'grid', gap: SPACING.md }}>
            <Panel title="Execution settings">
              <SettingRow label="C standard">
                <select
                  value={executionConfig.standard}
                  onChange={(event) =>
                    setExecutionConfig({ ...executionConfig, standard: event.target.value as ExecutionConfig['standard'] })
                  }
                  style={controlStyle}
                >
                  <option value="c99">C99</option>
                  <option value="c11">C11</option>
                  <option value="c17">C17</option>
                </select>
              </SettingRow>
              <SettingRow label="Optimization">
                <select
                  value={executionConfig.optimization}
                  onChange={(event) =>
                    setExecutionConfig({
                      ...executionConfig,
                      optimization: event.target.value as ExecutionConfig['optimization'],
                    })
                  }
                  style={controlStyle}
                >
                  <option value="O0">O0 — learning default</option>
                  <option value="O1">O1</option>
                  <option value="O2">O2</option>
                </select>
              </SettingRow>
              <SettingRow label="Time limit">
                <select
                  value={executionConfig.timeoutMs}
                  onChange={(event) =>
                    setExecutionConfig({ ...executionConfig, timeoutMs: Number(event.target.value) })
                  }
                  style={controlStyle}
                >
                  <option value={1000}>1 s</option>
                  <option value={5000}>5 s</option>
                  <option value={10000}>10 s</option>
                  <option value={30000}>30 s</option>
                </select>
              </SettingRow>
              <SettingRow label="Debug symbols">
                <input
                  type="checkbox"
                  checked={executionConfig.debugSymbols}
                  onChange={(event) =>
                    setExecutionConfig({ ...executionConfig, debugSymbols: event.target.checked })
                  }
                />
              </SettingRow>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: `${SPACING.sm} 0 0 0` }}>
                Debug symbols are required for the line-by-line debugger.
              </Text>
            </Panel>

            <Panel title="Program">
              <SettingRow label="Name">
                <input
                  value={programName}
                  onChange={(event) => setProgramName(event.target.value)}
                  style={controlStyle}
                />
              </SettingRow>
              <SettingRow label="Identifier">
                <input
                  value={programId}
                  onChange={(event) => setProgramId(event.target.value)}
                  style={controlStyle}
                />
              </SettingRow>
              {hasUnsavedChanges && (
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.warning, margin: `${SPACING.sm} 0 0 0` }}>
                  ● Unsaved changes — press “Save program” to write them to the workspace file.
                </Text>
              )}
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: `${SPACING.sm} 0 0 0` }}>
                Saved programs are stored as .c files in your workspace. Open the file in the VS Code editor to get the
                full editing experience (find &amp; replace, folding, formatting).
              </Text>
            </Panel>

            <Panel title="Saved programs">
              {programs.length === 0 ? (
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
                  No saved programs yet.
                </Text>
              ) : (
                <Box style={{ display: 'grid', gap: SPACING.xs }}>
                  {programs.map((program) => (
                    <Flex key={program.id} gap={SPACING.sm} align="center">
                      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, flex: 1 }}>
                        {program.name}
                      </Text>
                      <Button variant="ghost" size="sm" onClick={() => handleLoad(program.id)}>
                        Open
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(program.id)}>
                        Delete
                      </Button>
                    </Flex>
                  ))}
                </Box>
              )}
            </Panel>
          </Box>
        </Box>
      )}

      {tab === 'debug' && (
        <Box style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: SPACING.lg, alignItems: 'start' } as React.CSSProperties}>
          <Box style={{ display: 'grid', gap: SPACING.md }}>
            <Box
              style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
              }}
            >
              <DebugControls
                state={debugState}
                onStart={handleStartDebugging}
                onContinue={() => handleDebugAction('continue')}
                onStepOver={() => handleDebugAction('over')}
                onStepInto={() => handleDebugAction('into')}
                onStepOut={() => handleDebugAction('out')}
                onRestart={handleRestartDebugging}
                onStop={handleStopDebugging}
                debuggerAvailable={debuggerInfo?.available === true}
              />
            </Box>

            <CodeEditor
              value={source}
              onChange={setSource}
              breakpoints={breakpoints}
              markers={editorMarkers}
              currentLine={debugState.currentLine}
              onToggleBreakpoint={toggleBreakpoint}
              readOnly={debugState.status === 'paused' || debugState.status === 'running'}
            />

            <ExecutionTracePanel state={debugState} events={traceEvents} />
          </Box>

          <Box style={{ display: 'grid', gap: SPACING.md }}>
            <Panel title="Variables">
              <VariableInspector variables={debugState.variables} />
            </Panel>
            <Panel title="Call stack">
              <CallStackPanel frames={debugState.callStack} />
            </Panel>
            <Panel title="Breakpoints">
              {breakpoints.length === 0 ? (
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
                  No breakpoints. Click a line number in the editor to set one.
                </Text>
              ) : (
                <Flex gap={SPACING.sm} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
                  {breakpoints.map((line) => (
                    <Button key={line} variant="ghost" size="sm" onClick={() => toggleBreakpoint(line)}>
                      line {line}
                    </Button>
                  ))}
                </Flex>
              )}
            </Panel>
          </Box>
        </Box>
      )}

      {tab === 'tests' && (
        <Box style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: SPACING.lg, alignItems: 'start' } as React.CSSProperties}>
          <TestCaseManager testCases={testCases} onChange={setTestCases} onRunAll={handleRunTests} />
          <Panel title="Test results">
            <TestResultsPanel summary={testSummary} />
          </Panel>
        </Box>
      )}

      {tab === 'reference' && (
        <Box style={{ display: 'grid', gap: SPACING.lg }}>
          {!reference ? (
            <Box
              style={{
                padding: SPACING.lg,
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.lg,
              }}
            >
              <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
                Reference implementation
              </Text>
              <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: 0 }}>
                Select an algorithm in the Code tab to compare your implementation with the reviewed reference
                implementation from the algorithm library.
              </Text>
            </Box>
          ) : (
            <>
              <Box
                style={{
                  padding: SPACING.lg,
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.lg,
                }}
              >
                <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
                  {reference.algorithmName} — reviewed reference implementation
                </Text>
                <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: '0 0 1rem 0' }}>
                  {reference.approach}
                </Text>

                <Flex gap={SPACING.lg} style={{ flexWrap: 'wrap', marginBottom: SPACING.md } as React.CSSProperties}>
                  <InfoChip label="Best" value={reference.timeComplexity.best} />
                  <InfoChip label="Average" value={reference.timeComplexity.average} />
                  <InfoChip label="Worst" value={reference.timeComplexity.worst} />
                  <InfoChip label="Auxiliary space" value={reference.spaceComplexity.auxiliary} />
                </Flex>

                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.warning, margin: 0 }}>
                  Sharing an algorithm name does not make two implementations equivalent. Use the Tests tab to compare
                  your program with the expected output on concrete inputs — that is what proves the behaviour.
                </Text>
              </Box>

              <Box style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: SPACING.lg } as React.CSSProperties}>
                <Box
                  style={{
                    backgroundColor: '#0b1220',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.md,
                    overflow: 'auto',
                    maxHeight: 460,
                  }}
                >
                  <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
                    Reference C code
                  </Text>
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: '"SF Mono", Menlo, monospace',
                      fontSize: '0.74rem',
                      lineHeight: 1.55,
                      color: COLORS.textSecondary,
                      whiteSpace: 'pre',
                    }}
                  >
                    {reference.sourceCode}
                  </pre>
                </Box>

                <Box
                  style={{
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.md,
                  }}
                >
                  <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
                    Pseudocode
                  </Text>
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: '"SF Mono", Menlo, monospace',
                      fontSize: '0.76rem',
                      lineHeight: 1.6,
                      color: COLORS.textSecondary,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {reference.pseudocode.join('\n')}
                  </pre>

                  <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '1.25rem 0 0.5rem 0' }}>
                    Logic blocks
                  </Text>
                  {reference.logicBlocks.map((block) => (
                    <Box key={block.id} style={{ marginBottom: SPACING.sm }}>
                      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.accent, margin: 0, fontWeight: 600 }}>
                        {block.name}
                      </Text>
                      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0.1rem 0 0 0' }}>
                        {block.explanation}
                      </Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            </>
          )}
        </Box>
      )}

      {tab === 'history' && (
        <Box
          style={{
            padding: SPACING.lg,
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.lg,
          }}
        >
          <Flex gap={SPACING.sm} align="center" justify="between" style={{ marginBottom: SPACING.md } as React.CSSProperties}>
            <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: 0 }}>
              Execution history
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => postToExtension({ type: PLAYGROUND_MESSAGES.CLEAR_HISTORY })}
              disabled={history.length === 0}
            >
              Clear history
            </Button>
          </Flex>

          {history.length === 0 ? (
            <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: 0 }}>
              No runs recorded yet. The history stores the input, output, exit status and duration of every run — nothing
              else from your machine.
            </Text>
          ) : (
            <Box style={{ display: 'grid', gap: SPACING.sm }}>
              {history.map((entry) => (
                <Box
                  key={entry.id}
                  style={{
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: RADIUS.sm,
                    padding: SPACING.sm,
                    backgroundColor: COLORS.surfaceElevated,
                  }}
                >
                  <Flex gap={SPACING.sm} align="center">
                    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
                      {entry.programName}
                    </Text>
                    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
                      {new Date(entry.executedAt).toLocaleString()}
                    </Text>
                    <span style={{ flex: 1 }} />
                    <Text
                      as="p"
                      style={{
                        ...TYPOGRAPHY.small,
                        color: entry.status === 'success' ? COLORS.success : COLORS.error,
                        margin: 0,
                      }}
                    >
                      {entry.status} · {entry.durationMs} ms
                    </Text>
                  </Flex>
                  {entry.stdout && (
                    <pre
                      style={{
                        margin: `${SPACING.xs} 0 0 0`,
                        fontFamily: '"SF Mono", Menlo, monospace',
                        fontSize: '0.72rem',
                        color: COLORS.textSecondary,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {entry.stdout}
                    </pre>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const controlStyle: React.CSSProperties = {
  padding: '0.3rem 0.45rem',
  backgroundColor: COLORS.surfaceElevated,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.sm,
  color: COLORS.textPrimary,
  fontSize: '0.78rem',
  width: '100%',
};

const Panel: FunctionComponent<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box
    style={{
      backgroundColor: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
    }}
  >
    <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.75rem 0' }}>
      {title}
    </Text>
    {children}
  </Box>
);

const SettingRow: FunctionComponent<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Flex gap={SPACING.sm} align="center" style={{ marginBottom: SPACING.sm } as React.CSSProperties}>
    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0, minWidth: 110 }}>
      {label}
    </Text>
    <Box style={{ flex: 1 }}>{children}</Box>
  </Flex>
);

const InfoChip: FunctionComponent<{ label: string; value: string }> = ({ label, value }) => (
  <Box
    style={{
      padding: `${SPACING.xs} ${SPACING.sm}`,
      borderRadius: RADIUS.sm,
      backgroundColor: COLORS.surfaceElevated,
    }}
  >
    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0, fontSize: '0.7rem' }}>
      {label}
    </Text>
    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
      {value}
    </Text>
  </Box>
);
