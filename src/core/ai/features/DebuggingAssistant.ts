import type { ContextSelection } from '../AIContextBuilder';
import type { AISuggestion, ExplanationMode } from '../types';
import type { FeatureRequest } from './AlgorithmTutor';

/**
 * The debugging assistant.
 *
 * It works with the real compiler diagnostics and the real execution result
 * of Phase 5 — the assistant explains the evidence, it never invents it.
 */

export interface DebuggingRequest {
  /** The source code the student is working on. */
  code?: string;
  fileName?: string;
  /** The diagnostics of the last compilation. */
  diagnostics?: Array<{
    severity: string;
    message: string;
    file: string;
    line: number;
    column: number | null;
    explanation: string;
  }>;
  /** The result of the last execution. */
  execution?: {
    status: string;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    durationMs: number;
  };
  question?: string;
  mode?: ExplanationMode;
}

export class DebuggingAssistant {
  build(request: DebuggingRequest): FeatureRequest {
    const mode = request.mode ?? 'beginner';

    const selection: ContextSelection = {
      code: request.code,
      codeFileName: request.fileName,
      diagnostics: request.diagnostics,
      execution: request.execution,
    };

    const evidence: string[] = [];
    if (request.diagnostics && request.diagnostics.length > 0) {
      evidence.push(
        `The compiler reported ${request.diagnostics.length} diagnostic(s):`
      );
    }
    if (request.execution) {
      evidence.push(
        `The last run finished with the status "${request.execution.status}" and the exit code ${request.execution.exitCode ?? 'none'}.`
      );
    }

    const question =
      request.question?.trim() ||
      `Help me understand this problem.${
        evidence.length > 0 ? `\n\n${evidence.join('\n')}` : ''
      }`;

    return {
      task: 'debugging',
      question,
      mode,
      selection,
      suggestions: this.getSuggestions(),
    };
  }

  getSuggestions(): AISuggestion[] {
    return [
      { id: 'meaning', text: 'What does this compiler message mean?' },
      { id: 'why', text: 'Why did this error happen?' },
      { id: 'fix', text: 'How do I correct it?' },
      { id: 'logic', text: 'Is my algorithm wrong, or only my code?' },
      { id: 'wrong-output', text: 'Why is the output wrong?' },
      { id: 'loop', text: 'Why does my loop not terminate?' },
    ];
  }

  /**
   * A short summary of the evidence — shown in the UI so the student sees
   * what the assistant is working with.
   */
  summarize(request: DebuggingRequest): string {
    const parts: string[] = [];

    if (request.diagnostics?.length) {
      const errors = request.diagnostics.filter((d) => d.severity === 'error').length;
      parts.push(
        `${errors} error(s) and ${request.diagnostics.length - errors} warning(s) from the compiler`
      );
    }
    if (request.execution) {
      parts.push(
        `the last run ended with "${request.execution.status}" after ${request.execution.durationMs} ms`
      );
    }

    return parts.join(' · ');
  }
}
