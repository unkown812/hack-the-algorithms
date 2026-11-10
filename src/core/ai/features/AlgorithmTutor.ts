import { getAlgorithmById } from '../../algorithms/registry';
import { retrievalService } from '../AIRetrievalService';
import type { ContextSelection } from '../AIContextBuilder';
import type { AISuggestion, ExplanationMode } from '../types';

/**
 * The algorithm tutor.
 *
 * The explanation is always based on the verified algorithm registry — the
 * tutor never invents a complexity class or an implementation detail.
 */

export interface AlgorithmTutorRequest {
  algorithmId: string;
  /** An optional extra question of the student. */
  question?: string;
  mode?: ExplanationMode;
  /** The follow-up questions the student can choose. */
}

export interface FeatureRequest {
  task: string;
  question: string;
  selection: ContextSelection;
  mode: ExplanationMode;
  suggestions?: AISuggestion[];
}

export class AlgorithmTutor {
  /** Builds the request that explains an algorithm. */
  build(request: AlgorithmTutorRequest): FeatureRequest {
    const algorithm = getAlgorithmById(request.algorithmId);
    const mode = request.mode ?? 'beginner';

    const question =
      request.question?.trim() ||
      `Explain ${algorithm?.name ?? request.algorithmId} for the DAA course.`;

    return {
      task: 'algorithm-explanation',
      question,
      mode,
      selection: { algorithmId: request.algorithmId },
      suggestions: this.getFollowUps(request.algorithmId),
    };
  }

  /** The follow-up questions of the algorithm tutor. */
  getFollowUps(algorithmId: string): AISuggestion[] {
    const algorithm = getAlgorithmById(algorithmId);
    const name = algorithm?.name ?? algorithmId;

    return [
      { id: 'why-works', text: `Why does ${name} work?` },
      { id: 'explain-line', text: `Explain this line of the ${name} implementation.` },
      { id: 'other-input', text: `What happens if the input changes?` },
      { id: 'better-approach', text: 'Is there a better approach for this problem?' },
      { id: 'worst-case', text: 'Why is the worst case different from the average case?' },
      { id: 'cases', text: 'What is the difference between the best, average and worst case?' },
    ];
  }

  /** The verified material of an algorithm — used by the offline provider. */
  getResources(algorithmId: string): string[] {
    return retrievalService.getAlgorithmDocuments(algorithmId).map((doc) => doc.content);
  }
}
