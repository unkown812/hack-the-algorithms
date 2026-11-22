import * as vscode from 'vscode';
import { PLAYGROUND_MESSAGES } from '../../shared/constants';
import { PlaygroundService } from '../../core/playground/PlaygroundService';
import { VSCodeProgramStorage } from '../services/program-storage';
import { normalizeExecutionConfig } from '../../core/execution/ExecutionConfig';
import type {
  CompilerConfiguration,
  DebugSessionState,
  ExecutionConfig,
  TestCase,
  TraceEvent,
} from '../../core/playground/types';

/**
 * Bridges the Code Playground webview and the host services.
 *
 * Everything that touches a compiler, a process or the file system happens
 * here in the extension host, so the webview stays a pure view.
 */
export class PlaygroundMessageHandler {
  private readonly storage: VSCodeProgramStorage;
  private readonly service: PlaygroundService;

  constructor(
    context: vscode.ExtensionContext,
    private readonly post: (message: { type: string; payload?: unknown }) => void
  ) {
    this.storage = new VSCodeProgramStorage(context);
    this.service = new PlaygroundService(this.storage, {
      onStatus: (state: DebugSessionState) => {
        this.post({ type: PLAYGROUND_MESSAGES.DEBUG_STATE_CHANGED, payload: state });
      },
      onTraceEvent: (event: TraceEvent) => {
        this.post({ type: PLAYGROUND_MESSAGES.TRACE_EVENT_RECEIVED, payload: event });
      },
    });
  }

  /** Handles one message coming from the webview. */
  async handle(message: { type: string; payload?: unknown }): Promise<void> {
    const payload = (message.payload ?? {}) as Record<string, unknown>;

    switch (message.type) {
    case PLAYGROUND_MESSAGES.GET_COMPILER_STATUS: {
      this.post({
        type: PLAYGROUND_MESSAGES.COMPILER_STATUS,
        payload: {
          info: this.service.getCompilerInfo(),
          configuration: this.service.getConfiguration(),
          debugger: this.service.getDebuggerInfo(),
        },
      });
      break;
    }

    case PLAYGROUND_MESSAGES.REFRESH_COMPILER: {
      const info = this.service.refreshCompiler();
      this.post({
        type: PLAYGROUND_MESSAGES.COMPILER_STATUS,
        payload: {
          info,
          configuration: this.service.getConfiguration(),
          debugger: this.service.getDebuggerInfo(),
        },
      });
      break;
    }

    case PLAYGROUND_MESSAGES.UPDATE_COMPILER_CONFIG: {
      const configuration = payload.configuration as Partial<CompilerConfiguration> | undefined;
      const info = await this.service.updateConfiguration(configuration ?? {});
      this.post({
        type: PLAYGROUND_MESSAGES.COMPILER_STATUS,
        payload: {
          info,
          configuration: this.service.getConfiguration(),
          debugger: this.service.getDebuggerInfo(),
        },
      });
      break;
    }

    case PLAYGROUND_MESSAGES.COMPILE_PROGRAM: {
      const source = String(payload.source ?? '');
      const executionConfig = normalizeExecutionConfig(
          payload.executionConfig as Partial<ExecutionConfig>
      );
      const result = this.service.compile(source, executionConfig);
      this.post({ type: PLAYGROUND_MESSAGES.COMPILE_RESULT, payload: result });
      break;
    }

    case PLAYGROUND_MESSAGES.RUN_PROGRAM: {
      const source = String(payload.source ?? '');
      const programId = String(payload.programId ?? 'program');
      const stdin = String(payload.stdin ?? '');
      const executionConfig = normalizeExecutionConfig(
          payload.executionConfig as Partial<ExecutionConfig>
      );

      const result = await this.service.run(source, programId, executionConfig, stdin);
      this.post({ type: PLAYGROUND_MESSAGES.EXECUTION_RESULT, payload: result });
      break;
    }

    case PLAYGROUND_MESSAGES.STOP_PROGRAM: {
      this.service.stop();
      break;
    }

    case PLAYGROUND_MESSAGES.RUN_TESTS: {
      const source = String(payload.source ?? '');
      const testCases = (payload.testCases ?? []) as TestCase[];
      const executionConfig = normalizeExecutionConfig(
          payload.executionConfig as Partial<ExecutionConfig>
      );

      const summary = await this.service.runTests(source, testCases, executionConfig);
      this.post({ type: PLAYGROUND_MESSAGES.TEST_RESULT, payload: summary });
      break;
    }

    case PLAYGROUND_MESSAGES.SAVE_PROGRAM: {
      const programId = String(payload.programId ?? 'program');
      const name = String(payload.name ?? 'program');
      const source = String(payload.source ?? '');
      const algorithmId = payload.algorithmId ? String(payload.algorithmId) : undefined;

      const saved = await this.storage.saveProgram(programId, name, source, algorithmId);
      this.post({
        type: PLAYGROUND_MESSAGES.PROGRAM_SAVED,
        payload: { programId, name, ...saved },
      });
      break;
    }

    case PLAYGROUND_MESSAGES.LOAD_PROGRAM: {
      const programId = String(payload.programId ?? '');
      const source = await this.storage.loadProgram(programId);
      const testCases = await this.storage.loadTestCases(programId);
      this.post({
        type: PLAYGROUND_MESSAGES.PROGRAM_SAVED,
        payload: { programId, source, testCases },
      });
      break;
    }

    case PLAYGROUND_MESSAGES.OPEN_PROGRAM_FILE: {
      const programId = String(payload.programId ?? '');
      const filePath = await this.storage.getProgramPath(programId);
      if (!filePath) {
        void vscode.window.showWarningMessage('Save the program first — there is no file to open yet.');
        break;
      }
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
      await vscode.window.showTextDocument(document);
      break;
    }

    case PLAYGROUND_MESSAGES.DELETE_PROGRAM: {
      const programId = String(payload.programId ?? '');
      await this.storage.deleteProgram(programId);
      const programs = await this.storage.listPrograms();
      this.post({ type: PLAYGROUND_MESSAGES.PROGRAMS_LIST, payload: { programs } });
      break;
    }

    case PLAYGROUND_MESSAGES.LIST_PROGRAMS: {
      const programs = await this.storage.listPrograms();
      this.post({ type: PLAYGROUND_MESSAGES.PROGRAMS_LIST, payload: { programs } });
      break;
    }

    case PLAYGROUND_MESSAGES.SAVE_TEST_CASES: {
      const programId = String(payload.programId ?? '');
      const testCases = (payload.testCases ?? []) as TestCase[];
      await this.storage.saveTestCases(programId, testCases);
      this.post({
        type: PLAYGROUND_MESSAGES.TEST_CASES_LOADED,
        payload: { programId, testCases },
      });
      break;
    }

    case PLAYGROUND_MESSAGES.LOAD_TEST_CASES: {
      const programId = String(payload.programId ?? '');
      const testCases = await this.storage.loadTestCases(programId);
      this.post({
        type: PLAYGROUND_MESSAGES.TEST_CASES_LOADED,
        payload: { programId, testCases },
      });
      break;
    }

    case PLAYGROUND_MESSAGES.GET_HISTORY: {
      const entries = await this.storage.listHistory();
      this.post({ type: PLAYGROUND_MESSAGES.HISTORY_LOADED, payload: { entries } });
      break;
    }

    case PLAYGROUND_MESSAGES.CLEAR_HISTORY: {
      await this.storage.clearHistory();
      this.post({ type: PLAYGROUND_MESSAGES.HISTORY_LOADED, payload: { entries: [] } });
      break;
    }

    case PLAYGROUND_MESSAGES.START_DEBUGGING: {
      const source = String(payload.source ?? '');
      const algorithmId = payload.algorithmId ? String(payload.algorithmId) : null;
      const breakpoints = (payload.breakpoints ?? []) as number[];
      const executionConfig = normalizeExecutionConfig(
          payload.executionConfig as Partial<ExecutionConfig>
      );

      const state = await this.service.startDebugging(
        source,
        algorithmId,
        breakpoints,
        executionConfig
      );
      this.post({ type: PLAYGROUND_MESSAGES.DEBUG_STATE_CHANGED, payload: state });
      break;
    }

    case PLAYGROUND_MESSAGES.DEBUG_ACTION: {
      const action = String(payload.action ?? 'continue') as
          | 'continue'
          | 'over'
          | 'into'
          | 'out';
      const state = await this.service.stepDebugging(action);
      this.post({ type: PLAYGROUND_MESSAGES.DEBUG_STATE_CHANGED, payload: state });
      break;
    }

    case PLAYGROUND_MESSAGES.STOP_DEBUGGING: {
      await this.service.stopDebugging();
      this.post({
        type: PLAYGROUND_MESSAGES.DEBUG_STATE_CHANGED,
        payload: this.service.getDebugState(),
      });
      break;
    }

    case PLAYGROUND_MESSAGES.GET_DEBUG_STATE: {
      this.post({
        type: PLAYGROUND_MESSAGES.DEBUG_STATE_CHANGED,
        payload: this.service.getDebugState(),
      });
      break;
    }

    default:
      break;
    }
  }

  /** Releases the resources of the playground (debug sessions, storage). */
  async dispose(): Promise<void> {
    await this.service.stopDebugging();
  }
}
