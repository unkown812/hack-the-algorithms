import { removeWorkingDirectory } from './ProcessManager';

/**
 * Tracks one local program execution so that it can be stopped from the UI.
 *
 * A session owns the temporary working directory of the program and the
 * cancellation flag that the process manager polls.
 */
export class ExecutionSession {
  readonly id: string;
  readonly startedAt: number;
  readonly workingDirectory: string | null;

  private abortState = { aborted: false };
  private finished = false;

  constructor(id: string, workingDirectory: string | null) {
    this.id = id;
    this.startedAt = Date.now();
    this.workingDirectory = workingDirectory;
  }

  /** The signal object polled by the process manager. */
  get signal(): { aborted: boolean } {
    return this.abortState;
  }

  /** Requests cancellation of the running program. */
  cancel(): void {
    this.abortState.aborted = true;
  }

  get isCancelled(): boolean {
    return this.abortState.aborted;
  }

  get isFinished(): boolean {
    return this.finished;
  }

  /** Marks the session as completed and removes the temporary directory. */
  finish(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    removeWorkingDirectory(this.workingDirectory);
  }
}
