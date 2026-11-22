import { retrievalService } from '../AIRetrievalService';
import type { AISuggestion, ExplanationMode } from '../types';
import type { FeatureRequest } from './AlgorithmTutor';

/**
 * The AI practical exam assistant.
 *
 * The explanations are based on the verified practical exercises — the
 * theory, the algorithm, the pseudocode, the reference C program, the
 * complexity and the viva questions. The assistant never invents a
 * program output or a sample result.
 *
 * The assistant can generate a practical paper (guided mode) and viva
 * questions. It never overwrites the student\'s source code.
 */

export interface PracticalAssistantRequest {
  /** Which practical to explain. */
  practicalId?: string;
  /** The student\'s question. */
  question?: string;
  /** The task that shapes the answer. */
  task?: 'practical' | 'viva' | 'mock-exam' | 'mock-exam-suggest';
  /** The explanation mode. */
  mode?: ExplanationMode;
}

export class PracticalAssistant {
  /** Builds the request that explains a practical. */
  build(request: PracticalAssistantRequest): FeatureRequest {
    const mode = request.mode ?? 'beginner';
    const task = request.task ?? 'practical';

    const practicalId = request.practicalId ?? 'prac-binary-search';
    const practicalName = practicalId.replace(/-/g, ' ');
    const question =
      request.question?.trim() ||
      (task === 'viva'
        ? `Generate viva questions for "${practicalName}".`
        : task === 'mock-exam-suggest'
          ? `Suggest a mock exam based on "${practicalName}".`
          : task === 'mock-exam'
            ? `Generate a mock exam that includes "${practicalName}".`
            : `Explain the practical "${practicalName}" for the DAA course.`);

    return {
      task,
      question,
      mode,
      selection: {},
      suggestions: this.getSuggestions(task),
    };
  }

  /** The follow-up questions of the practical assistant. */
  getSuggestions(task?: string): AISuggestion[] {
    const base: AISuggestion[] = [
      { id: 'practical-info', text: 'Explain the theory, the algorithm and the C implementation.' },
      { id: 'sample-input', text: 'Show the sample input and output.' },
      { id: 'complexity', text: 'Explain the time and space complexity.' },
      { id: 'viva-q', text: 'Generate viva questions.' },
      { id: 'mock-exam', text: 'Create a mock exam with this practical.' },
    ];

    if (task === 'viva') {
      return [
        { id: 'viva-for-practical', text: 'Generate viva questions for the entire practical.' },
        { id: 'viva-by-category', text: 'Generate viva questions by topic category.' },
        { id: 'viva-by-difficulty', text: 'Generate viva questions by difficulty level.' },
      ];
    }
    if (task === 'mock-exam' || task === 'mock-exam-suggest') {
      return [
        { id: 'add-to-existing', text: 'Add this practical to an existing mock exam.' },
        { id: 'create-new-mock', text: 'Create a new mock exam with this practical.' },
        { id: 'check-pass', text: 'Check whether a mock exam passes with this practical.' },
      ];
    }
    return base;
  }

  /** The verified material of a practical — used by the offline provider. */
  getResources(practicalId: string): string[] {
    // The id "prac-binary-search" becomes the query "binary search".
    const query = practicalId.replace(/^prac-/, '').replace(/-/g, ' ');
    const documents = retrievalService.search(query, { limit: 4, kinds: ['practical'] });
    const resources: string[] = [];
    for (const document of documents) {
      resources.push(`${document.title}:\n${document.content}`);
    }
    return resources;
  }
}
