import type { ContextSelection } from '../AIContextBuilder';
import type { AISuggestion, ExplanationMode } from '../types';
import type { FeatureRequest } from './AlgorithmTutor';

/**
 * The complexity tutor.
 *
 * The deterministic services of Phase 4 remain the authority: the assistant
 * explains and interprets their results, it never recalculates them.
 */

export interface ComplexityRequest {
  algorithmId?: string;
  /** The results of the Phase 4 analyzer. */
  complexity?: {
    theoretical: { best: string; average: string; worst: string; auxiliary: string };
    instrumented?: { comparisons: number; swaps: number; totalOperations: number };
    measured?: { meanTimeMs: number; trials: number };
  };
  /** The code the student wants to analyse. */
  code?: string;
  question?: string;
  mode?: ExplanationMode;
}

export class ComplexityTutor {
  build(request: ComplexityRequest): FeatureRequest {
    const mode = request.mode ?? 'detailed';

    const selection: ContextSelection = {
      algorithmId: request.algorithmId,
      code: request.code,
      complexity: request.complexity,
    };

    const question =
      request.question?.trim() ||
      (request.algorithmId
        ? `Explain the time and space complexity of ${request.algorithmId.replace(/-/g, ' ')}.`
        : 'Explain the time and space complexity of this code.');

    return {
      task: 'complexity',
      question,
      mode,
      selection,
      suggestions: this.getSuggestions(),
    };
  }

  getSuggestions(): AISuggestion[] {
    return [
      { id: 'derive', text: 'Derive the complexity step by step.' },
      { id: 'recurrence', text: 'What is the recurrence relation of this algorithm?' },
      { id: 'nested', text: 'How do I analyse nested loops?' },
      { id: 'recursive', text: 'How do I analyse a recursive function?' },
      { id: 'dominant', text: 'Which term dominates the running time?' },
      { id: 'cases', text: 'Explain the best, average and worst case.' },
      { id: 'notation', text: 'What is the difference between O, Ω and Θ?' },
    ];
  }

  /**
   * The text that explains which numbers are measured and which are only
   * theoretical — the assistant is told about it through the context.
   */
  buildEvidenceNote(request: ComplexityRequest): string {
    const parts: string[] = [];
    if (request.complexity?.theoretical) {
      parts.push('The theoretical classes come from the reviewed algorithm metadata.');
    }
    if (request.complexity?.instrumented) {
      parts.push(
        'The operation counts were produced by the instrumented engine — they are deterministic counts, not estimates.'
      );
    }
    if (request.complexity?.measured) {
      parts.push(
        `The running time was measured in this environment over ${request.complexity.measured.trials} trials — it depends on the machine and is not a property of the algorithm.`
      );
    }
    return parts.join(' ');
  }
}
