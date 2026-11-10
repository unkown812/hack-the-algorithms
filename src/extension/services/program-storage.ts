import * as vscode from 'vscode';
import * as path from 'node:path';
import type { ProgramStorage } from '../../core/playground/PlaygroundService';
import type { TestCase } from '../../core/playground/types';

/**
 * Persistence for the Code Playground.
 *
 * - Program sources are stored as real files in the workspace (or in the
 *   extension's global storage when no folder is open). Source code never
 *   goes into the extension state.
 * - Test cases are small metadata and live in the workspace state.
 * - The execution history is lightweight metadata in the global state.
 */

const PROGRAM_DIRECTORY = '.daa-playground/programs';
const TEST_CASE_KEY = 'daa.playground.testCases';
const HISTORY_KEY = 'daa.playground.history';
const HISTORY_LIMIT = 50;

export interface StoredProgram {
  id: string;
  name: string;
  filePath: string;
  algorithmId?: string;
  updatedAt: number;
}

interface HistoryEntry {
  id: string;
  programId: string;
  programName: string;
  algorithmId?: string;
  executedAt: number;
  status: string;
  compilerVersion: string;
  configuration: { standard: string; optimization: string; timeoutMs: number };
  input: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  diagnosticCount: number;
}

export class VSCodeProgramStorage implements ProgramStorage {
  constructor(private readonly context: vscode.ExtensionContext) {}

  /** The folder used for program files. */
  get programDirectory(): vscode.Uri {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (folder) {
      return vscode.Uri.joinPath(folder.uri, ...PROGRAM_DIRECTORY.split('/'));
    }
    return vscode.Uri.joinPath(this.context.globalStorageUri, 'programs');
  }

  private programUri(programId: string): vscode.Uri {
    const safeId = programId.replace(/[^a-zA-Z0-9._-]/g, '_');
    return vscode.Uri.joinPath(this.programDirectory, `${safeId}.c`);
  }

  async saveProgram(
    programId: string,
    name: string,
    source: string,
    algorithmId?: string
  ): Promise<{ filePath: string; updatedAt: number }> {
    const uri = this.programUri(programId);
    await vscode.workspace.fs.createDirectory(this.programDirectory);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(source, 'utf8'));

    const programs = this.readProgramIndex();
    const updatedAt = Date.now();
    programs[programId] = { id: programId, name, filePath: uri.fsPath, algorithmId, updatedAt };
    await this.context.workspaceState.update('daa.playground.programs', programs);

    return { filePath: uri.fsPath, updatedAt };
  }

  async loadProgram(programId: string): Promise<string | null> {
    try {
      const content = await vscode.workspace.fs.readFile(this.programUri(programId));
      return Buffer.from(content).toString('utf8');
    } catch {
      return null;
    }
  }

  async getProgramPath(programId: string): Promise<string | null> {
    const program = this.readProgramIndex()[programId];
    if (program) {
      return program.filePath;
    }
    // The program may exist on disk without being registered yet.
    const uri = this.programUri(programId);
    try {
      await vscode.workspace.fs.stat(uri);
      return uri.fsPath;
    } catch {
      return null;
    }
  }

  async deleteProgram(programId: string): Promise<void> {
    try {
      await vscode.workspace.fs.delete(this.programUri(programId));
    } catch {
      // The file may already be gone.
    }

    const programs = this.readProgramIndex();
    delete programs[programId];
    await this.context.workspaceState.update('daa.playground.programs', programs);

    const testCases = this.readTestCaseMap();
    delete testCases[programId];
    await this.context.workspaceState.update(TEST_CASE_KEY, testCases);
  }

  async listPrograms(): Promise<StoredProgram[]> {
    const programs = this.readProgramIndex();
    return Object.values(programs).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async saveTestCases(programId: string, testCases: TestCase[]): Promise<void> {
    const map = this.readTestCaseMap();
    map[programId] = testCases;
    await this.context.workspaceState.update(TEST_CASE_KEY, map);
  }

  async loadTestCases(programId: string): Promise<TestCase[]> {
    const map = this.readTestCaseMap();
    return map[programId] ?? [];
  }

  async recordHistory(entry: Omit<HistoryEntry, 'id' | 'executedAt'>): Promise<void> {
    const history = this.readHistory();
    history.unshift({
      ...entry,
      id: `history-${Date.now().toString(36)}-${history.length}`,
      executedAt: Date.now(),
    });
    await this.context.globalState.update(HISTORY_KEY, history.slice(0, HISTORY_LIMIT));
  }

  async listHistory(limit = 20): Promise<HistoryEntry[]> {
    return this.readHistory().slice(0, limit);
  }

  async clearHistory(): Promise<void> {
    await this.context.globalState.update(HISTORY_KEY, []);
  }

  private readProgramIndex(): Record<string, StoredProgram> {
    return this.context.workspaceState.get<Record<string, StoredProgram>>(
      'daa.playground.programs',
      {}
    );
  }

  private readTestCaseMap(): Record<string, TestCase[]> {
    return this.context.workspaceState.get<Record<string, TestCase[]>>(TEST_CASE_KEY, {});
  }

  private readHistory(): HistoryEntry[] {
    return this.context.globalState.get<HistoryEntry[]>(HISTORY_KEY, []);
  }
}

/** Creates a default program name for a new playground session. */
export function defaultProgramName(): string {
  const now = new Date();
  const stamp = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  return `program-${stamp}`;
}

/** Creates a stable program id. */
export function createProgramId(): string {
  return `program-${Date.now().toString(36)}`;
}

/** Returns the path of the program folder (for display in the UI). */
export function describeProgramFolder(storage: VSCodeProgramStorage): string {
  return path.dirname(storage.programDirectory.fsPath);
}
