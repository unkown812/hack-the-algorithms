import type {
  AIProviderConfig,
  AIProviderId,
  AIProviderStatus,
  AIRequest,
  AIResponse,
} from './types';

/**
 * The provider abstraction.
 *
 * A provider is the only part of the AI layer that talks to the outside
 * world. Everything above it — the context builder, the retrieval service,
 * the features and the webview — is provider independent, so a new provider
 * can be added without touching the assistant.
 */

export class AIProviderError extends Error {
  constructor(
    readonly kind: AIResponse['error'],
    message: string,
    readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export interface AIProvider {
  readonly id: AIProviderId;
  readonly name: string;
  /** Whether the provider needs a credential. */
  readonly requiresKey: boolean;
  /** Whether the provider sends data to an external service. */
  readonly isExternal: boolean;
  readonly defaultModel: string;
  readonly models: string[];
  readonly documentationUrl?: string;

  /** The status shown in the settings — never contains the credential. */
  getStatus(hasKey: boolean): AIProviderStatus;

  /**
   * Sends a request and returns the answer.
   * The implementation must honour the abort signal of the request.
   */
  send(request: AIRequest, config: AIProviderConfig, apiKey?: string): Promise<AIResponse>;
}

/** The provider registry — the only place that knows the concrete providers. */
export class ProviderRegistry {
  private readonly providers = new Map<AIProviderId, AIProvider>();

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: AIProviderId): AIProvider | undefined {
    return this.providers.get(id);
  }

  list(): AIProvider[] {
    return [...this.providers.values()];
  }

  statuses(hasKey: (id: AIProviderId) => boolean): AIProviderStatus[] {
    return this.list().map((provider) => provider.getStatus(hasKey(provider.id)));
  }
}

/** Builds the error message a student can act on. */
export function describeProviderError(error: AIProviderError): string {
  switch (error.kind) {
    case 'not-configured':
      return 'No AI provider is configured. Add a provider in the settings — or keep using the local knowledge base, which needs no key at all.';
    case 'invalid-key':
      return 'The provider rejected the API key. Check the key in the settings and try again.';
    case 'network':
      return 'The provider could not be reached. Check your internet connection — the rest of the extension works offline.';
    case 'rate-limit':
      return `The provider is rate limiting the requests${
        error.retryAfterSeconds ? ` — try again in ${error.retryAfterSeconds} seconds` : ''
      }.`;
    case 'timeout':
      return 'The provider did not answer in time. Increase the timeout in the settings or try a shorter question.';
    case 'cancelled':
      return 'The request was cancelled.';
    case 'unsupported-model':
      return 'The selected model is not supported by the provider. Pick another model in the settings.';
    case 'empty-response':
      return 'The provider returned an empty answer. Try to rephrase the question.';
    case 'malformed-response':
      return 'The answer of the provider could not be read. Try again.';
    case 'server':
      return 'The provider reported an internal error. Try again in a moment.';
    default:
      return error.message;
  }
}
