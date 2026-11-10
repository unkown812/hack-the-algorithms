import type { AIContextItem, AIResponse, AISource } from './types';

/**
 * Checks an answer before it is shown to the student.
 *
 * The validator does not judge the correctness of the prose — it checks the
 * things the extension can verify: that the answer is not empty, that it does
 * not claim a compilation, an execution or a measurement that the shared
 * context does not contain, and that the sources are attached.
 */

export interface ValidationResult {
  valid: boolean;
  /** The answer that is shown — the original one when it is acceptable. */
  content: string;
  /** The problems that were found. */
  warnings: string[];
}

const FABRICATION_PATTERNS: Array<{ pattern: RegExp; warning: string }> = [
  {
    pattern: /\bI (compiled|ran|executed|tested) (the|your|this) (code|program)\b/i,
    warning:
      'The answer claims that the code was compiled or executed, but the shared context does not contain a compiler or execution result.',
  },
  {
    pattern: /\bthe (measured|actual) (execution time|runtime) is \d/i,
    warning:
      'The answer states a measured running time, but the shared context does not contain a benchmark result.',
  },
  {
    pattern: /\bI (measured|counted) \d+ (comparisons|operations|swaps)\b/i,
    warning:
      'The answer states operation counts, but the shared context does not contain instrumented counts.',
  },
];

export class AIResponseValidator {
  /**
   * Validates the answer.
   * `context` is the context that was actually sent — the claims of the
   * answer are checked against it.
   */
  validate(response: AIResponse, context: AIContextItem[]): ValidationResult {
    const warnings: string[] = [];

    if (!response.content || response.content.trim().length === 0) {
      return {
        valid: false,
        content: 'The assistant returned an empty answer. Please try to rephrase your question.',
        warnings: ['The answer was empty.'],
      };
    }

    const hasExecutionContext = context.some(
      (item) => item.kind === 'execution' || item.kind === 'diagnostics'
    );
    const hasMeasurementContext = context.some(
      (item) => item.kind === 'complexity' || item.kind === 'execution'
    );

    for (const { pattern, warning } of FABRICATION_PATTERNS) {
      if (!pattern.test(response.content)) {
        continue;
      }
      if (warning.includes('compiled') && hasExecutionContext) {
        continue;
      }
      if (warning.includes('measured') && hasMeasurementContext) {
        continue;
      }
      warnings.push(warning);
    }

    if (!response.fromKnowledgeBase && response.sources.length === 0 && context.length === 0) {
      warnings.push(
        'The answer was produced without any verified material of the extension — treat the details with care.'
      );
    }

    return {
      valid: warnings.length === 0 || warnings.every((warning) => !warning.startsWith('The answer was empty')),
      content: response.content,
      warnings,
    };
  }

  /** Adds the sources of the response when the provider did not send any. */
  withSources(response: AIResponse, sources: AISource[]): AIResponse {
    if (response.sources.length > 0 || sources.length === 0) {
      return response;
    }
    return { ...response, sources };
  }
}
