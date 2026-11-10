import { DEFAULT_AI_CONFIGURATION } from './types';
import type { AIProviderConfig, AIProviderId, ExplanationMode } from './types';

/**
 * The configuration of the AI layer.
 *
 * The configuration never contains a credential — the API key lives in the
 * VS Code SecretStorage and is only read by the provider manager in the
 * extension host.
 */

export interface AIConfigurationIssue {
  field: string;
  message: string;
}

/** Validates a configuration and returns the problems it has. */
export function validateAIConfiguration(
  config: AIProviderConfig,
  hasKey: boolean
): AIConfigurationIssue[] {
  const issues: AIConfigurationIssue[] = [];

  if (config.provider !== 'local' && !hasKey) {
    issues.push({
      field: 'apiKey',
      message: 'This provider needs an API key. Add one in the settings or switch to the local knowledge base.',
    });
  }

  if (config.temperature < 0 || config.temperature > 2) {
    issues.push({ field: 'temperature', message: 'The temperature must be between 0 and 2.' });
  }

  if (config.maxTokens < 64) {
    issues.push({ field: 'maxTokens', message: 'The answer must be at least 64 tokens long.' });
  }

  if (config.timeoutMs < 1000 || config.timeoutMs > 300000) {
    issues.push({
      field: 'timeoutMs',
      message: 'The request timeout must be between 1 and 300 seconds.',
    });
  }

  if (config.maxContextMessages < 1) {
    issues.push({
      field: 'maxContextMessages',
      message: 'At least one conversation message has to be sent.',
    });
  }

  if (config.maxContextCharacters < 500) {
    issues.push({
      field: 'maxContextCharacters',
      message: 'The context limit must be at least 500 characters.',
    });
  }

  return issues;
}

/** Merges a partial configuration into the current one. */
export function mergeAIConfiguration(
  current: AIProviderConfig,
  changes: Partial<AIProviderConfig>
): AIProviderConfig {
  const merged: AIProviderConfig = { ...current, ...changes };
  return {
    ...merged,
    provider: merged.provider as AIProviderId,
    temperature: clamp(merged.temperature, 0, 2),
    maxTokens: Math.round(clamp(merged.maxTokens, 64, 32000)),
    timeoutMs: Math.round(clamp(merged.timeoutMs, 1000, 300000)),
    maxContextMessages: Math.round(clamp(merged.maxContextMessages, 1, 50)),
    maxContextCharacters: Math.round(clamp(merged.maxContextCharacters, 500, 100000)),
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

/** The default configuration. */
export function createDefaultAIConfiguration(): AIProviderConfig {
  return { ...DEFAULT_AI_CONFIGURATION };
}

/** The label of an explanation mode. */
export function labelForMode(mode: ExplanationMode): string {
  switch (mode) {
    case 'beginner':
      return 'Beginner';
    case 'detailed':
      return 'Detailed';
    case 'step-by-step':
      return 'Step by step';
    case 'exam':
      return 'Exam preparation';
    case 'practical':
      return 'Practical';
    case 'interview':
      return 'Interview';
    case 'visual':
      return 'Visual learning';
    default:
      return mode;
  }
}
