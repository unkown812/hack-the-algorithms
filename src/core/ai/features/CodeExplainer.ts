import type { ContextSelection } from '../AIContextBuilder';
import type { AISuggestion, ExplanationMode } from '../types';
import type { FeatureRequest } from './AlgorithmTutor';

/**
 * The code explainer.
 *
 * It explains the code the student selected — it never reads other files and
 * it never changes the source code.
 */

export interface CodeExplainerRequest {
  code: string;
  fileName?: string;
  /** What the student asked for. */
  action?: 'explain' | 'function' | 'pseudocode' | 'bugs' | 'improve' | 'complexity' | 'document';
  question?: string;
  mode?: ExplanationMode;
}

const ACTION_TASKS: Record<NonNullable<CodeExplainerRequest['action']>, string> = {
  explain: 'code-explanation',
  function: 'code-explanation',
  pseudocode: 'code-explanation',
  bugs: 'debugging',
  improve: 'code-explanation',
  complexity: 'complexity',
  document: 'code-explanation',
};

const ACTION_QUESTIONS: Record<NonNullable<CodeExplainerRequest['action']>, string> = {
  explain: 'Explain this code.',
  function: 'Explain what this function does and how it is called.',
  pseudocode: 'Write the pseudocode of this code.',
  bugs: 'Find the potential logical mistakes in this code.',
  improve: 'Suggest improvements for this code — readability, naming, decomposition, input validation and efficiency.',
  complexity: 'Explain the time and space complexity of this code.',
  document: 'Write the documentation of this code.',
};

export class CodeExplainer {
  build(request: CodeExplainerRequest): FeatureRequest {
    const action = request.action ?? 'explain';
    const mode = request.mode ?? 'beginner';

    const selection: ContextSelection = {
      code: request.code,
      codeFileName: request.fileName,
    };

    return {
      task: ACTION_TASKS[action],
      question:
        request.question?.trim() ||
        `${ACTION_QUESTIONS[action]}\n\n\`\`\`c\n${request.code}\n\`\`\``,
      mode,
      selection,
      suggestions: this.getSuggestions(),
    };
  }

  getSuggestions(): AISuggestion[] {
    return [
      { id: 'dry-run', text: 'Walk me through this code with a small example.' },
      { id: 'variables', text: 'Which variables are important here?' },
      { id: 'recursion', text: 'Where is the recursion in this code?' },
      { id: 'data-structures', text: 'Which data structures does this code use?' },
      { id: 'pseudocode', text: 'Generate the pseudocode of this code.' },
      { id: 'mistakes', text: 'What could go wrong in this code?' },
    ];
  }
}
