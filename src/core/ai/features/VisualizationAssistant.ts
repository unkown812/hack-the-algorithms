import type { ContextSelection } from '../AIContextBuilder';
import type { AISuggestion, ExplanationMode } from '../types';
import type { FeatureRequest } from './AlgorithmTutor';

/**
 * The visualization assistant.
 *
 * The visualization engine stays responsible for the execution state — the
 * assistant only interprets the structured trace. A natural-language command
 * that changes the playback is translated into one of the existing controls,
 * which the webview then executes; the assistant never changes the state
 * itself.
 */

export type VisualizationCommand =
  | { type: 'none' }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'first' }
  | { type: 'last' }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'restart' };

export interface VisualizationStep {
  algorithmId: string;
  stepIndex: number;
  totalSteps?: number;
  description: string;
  explanation: string;
  operation: string;
  lineNumber?: number;
  array?: { values: number[]; comparedIndices?: number[]; swappedIndices?: number[] };
  variables?: Record<string, unknown>;
}

export interface VisualizationRequest {
  step?: VisualizationStep;
  question?: string;
  mode?: ExplanationMode;
}

export class VisualizationAssistant {
  /**
   * Translates a question into a playback command.
   * The command is executed by the existing visualization controls — the
   * assistant never touches the trace itself.
   */
  parseCommand(question: string): VisualizationCommand {
    const text = question.toLowerCase().trim();

    if (/\b(next|forward|continue|advance)\b/.test(text) && /\b(step|comparison|element|position)\b/.test(text)) {
      return { type: 'next' };
    }
    if (/\b(previous|back|go back)\b/.test(text)) {
      return { type: 'previous' };
    }
    if (/\b(first|beginning|start|restart from)\b/.test(text) && !/\brestart\b/.test(text)) {
      return { type: 'first' };
    }
    if (/\b(last|final|end)\b/.test(text)) {
      return { type: 'last' };
    }
    if (/\b(restart|start over|again)\b/.test(text)) {
      return { type: 'restart' };
    }
    if (/\b(play|run|continue automatically)\b/.test(text)) {
      return { type: 'play' };
    }
    if (/\b(pause|stop|wait)\b/.test(text)) {
      return { type: 'pause' };
    }

    return { type: 'none' };
  }

  build(request: VisualizationRequest): FeatureRequest {
    const mode = request.mode ?? 'beginner';
    const step = request.step;

    const selection: ContextSelection = step
      ? {
          visualization: {
            algorithmId: step.algorithmId,
            stepIndex: step.stepIndex,
            description: step.description,
            explanation: step.explanation,
            operation: step.operation,
            lineNumber: step.lineNumber,
            array: step.array,
            variables: step.variables,
          },
        }
      : {};

    const question =
      request.question?.trim() ||
      (step
        ? 'Explain the current step of the visualization.'
        : 'Explain the algorithm that is currently visualized.');

    return {
      task: 'visualization',
      question,
      mode,
      selection,
      suggestions: this.getSuggestions(),
    };
  }

  getSuggestions(): AISuggestion[] {
    return [
      { id: 'current', text: 'Explain the current step.' },
      { id: 'why-element', text: 'Why was this element selected?' },
      { id: 'next', text: 'What happens next?' },
      { id: 'next-comparison', text: 'Move to the next comparison.' },
      { id: 'whole-process', text: 'Explain the entire sorting process.' },
      { id: 'other-input', text: 'Show me how the algorithm changes with another input.' },
    ];
  }

  /**
   * A short, factual description of the current step.
   * It is built from the trace alone and never guesses a state.
   */
  describeStep(step: VisualizationStep | undefined): string {
    if (!step) {
      return 'No visualization step is active.';
    }

    const parts = [
      `${step.operation} — ${step.description}`,
      step.array ? `Array: [${step.array.values.join(', ')}]` : '',
      step.array?.comparedIndices?.length
        ? `Compared: ${step.array.comparedIndices
            .map((index) => `${index} (${step.array?.values[index]})`)
            .join(' and ')}`
        : '',
      step.array?.swappedIndices?.length
        ? `Exchanged: ${step.array.swappedIndices.join(', ')}`
        : '',
      step.totalSteps ? `Step ${step.stepIndex + 1} of ${step.totalSteps}` : '',
    ];

    return parts.filter(Boolean).join(' · ');
  }
}
