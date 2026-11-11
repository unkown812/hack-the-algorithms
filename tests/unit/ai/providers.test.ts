import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AIProviderError, ProviderRegistry } from '../../../src/core/ai/AIProvider';
import { OpenAIProvider } from '../../../src/core/ai/providers/OpenAIProvider';
import { GeminiProvider } from '../../../src/core/ai/providers/GeminiProvider';
import { LocalKnowledgeProvider } from '../../../src/core/ai/providers/LocalKnowledgeProvider';
import { describeProviderError } from '../../../src/core/ai/AIProvider';
import {
  DEFAULT_AI_CONFIGURATION,
  type AIProviderConfig,
  type AIRequest,
} from '../../../src/core/ai/types';
import { validateAIConfiguration, mergeAIConfiguration } from '../../../src/core/ai/AIConfiguration';

function makeRequest(overrides: Partial<AIRequest> = {}): AIRequest {
  return {
    messages: [
      { id: 'm1', role: 'user', content: 'Why is binary search O(log n)?', createdAt: 1 },
    ],
    systemPrompt: 'You are the tutor.',
    context: [],
    mode: 'beginner',
    ...overrides,
  };
}

const CONFIG: AIProviderConfig = {
  ...DEFAULT_AI_CONFIGURATION,
  provider: 'openai',
};

describe('AI configuration validation', () => {
  it('accepts a valid configuration', () => {
    const issues = validateAIConfiguration({ ...DEFAULT_AI_CONFIGURATION }, true);
    expect(issues).toHaveLength(0);
  });

  it('requires a key for key providers', () => {
    const issues = validateAIConfiguration(
      { ...DEFAULT_AI_CONFIGURATION, provider: 'openai' },
      false
    );
    expect(issues.some((issue) => issue.field === 'apiKey')).toBe(true);
  });

  it('does not require a key for the local provider', () => {
    const issues = validateAIConfiguration(
      { ...DEFAULT_AI_CONFIGURATION, provider: 'local' },
      false
    );
    expect(issues.some((issue) => issue.field === 'apiKey')).toBe(false);
  });

  it('rejects impossible values', () => {
    const issues = validateAIConfiguration(
      {
        ...DEFAULT_AI_CONFIGURATION,
        provider: 'local',
        temperature: 5,
        maxTokens: 1,
        timeoutMs: 10,
      },
      false
    );
    expect(issues.length).toBeGreaterThanOrEqual(3);
  });

  it('clamps values on merge', () => {
    const merged = mergeAIConfiguration(DEFAULT_AI_CONFIGURATION, {
      temperature: 99,
      maxTokens: 0,
      timeoutMs: -1,
    });
    expect(merged.temperature).toBe(2);
    expect(merged.maxTokens).toBe(64);
    expect(merged.timeoutMs).toBe(1000);
  });
});

describe('provider registry', () => {
  it('registers providers and builds statuses without credentials', () => {
    const registry = new ProviderRegistry();
    registry.register(new LocalKnowledgeProvider());
    registry.register(new OpenAIProvider());

    const statuses = registry.statuses(() => false);
    expect(statuses).toHaveLength(2);
    for (const status of statuses) {
      // The status must never carry the credential itself.
      expect('apiKey' in status).toBe(false);
      expect(status.hasKey).toBe(false);
    }
  });

  it('returns the registered provider by id', () => {
    const registry = new ProviderRegistry();
    const openai = new OpenAIProvider();
    registry.register(openai);
    expect(registry.get('openai')).toBe(openai);
    expect(registry.get('gemini')).toBeUndefined();
  });
});

describe('OpenAI provider', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the system prompt, the context and the conversation', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: 'Because it halves the range.' } }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const provider = new OpenAIProvider();
    const response = await provider.send(
      makeRequest({
        context: [
          {
            id: 'c1',
            kind: 'algorithm',
            label: 'Algorithm — Binary Search',
            content: 'Binary search halves the search interval.',
          },
        ],
      }),
      CONFIG,
      'test-key-123'
    );

    expect(response.content).toContain('halves the range');
    expect(response.provider).toBe('openai');
    expect(response.fromKnowledgeBase).toBe(false);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-key-123');
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1].content).toContain('Binary search halves the search interval.');
  });

  it('maps 401 to invalid-key', async () => {
    fetchMock.mockResolvedValue(new Response('Unauthorized', { status: 401 }));
    const provider = new OpenAIProvider();
    await expect(provider.send(makeRequest(), CONFIG, 'bad')).rejects.toMatchObject({
      kind: 'invalid-key',
    });
  });

  it('maps 429 to rate-limit with a retry hint when present', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"error":"rate limit"}', { status: 429 })
    );
    const provider = new OpenAIProvider();
    await expect(provider.send(makeRequest(), CONFIG, 'k')).rejects.toMatchObject({
      kind: 'rate-limit',
    });
  });

  it('maps 5xx to server errors', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));
    const provider = new OpenAIProvider();
    await expect(provider.send(makeRequest(), CONFIG, 'k')).rejects.toMatchObject({
      kind: 'server',
    });
  });

  it('reports an empty answer', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: '' } }] }), {
        status: 200,
      })
    );
    const provider = new OpenAIProvider();
    await expect(provider.send(makeRequest(), CONFIG, 'k')).rejects.toMatchObject({
      kind: 'empty-response',
    });
  });

  it('reports network failures', async () => {
    fetchMock.mockRejectedValue(new Error('connection refused'));
    const provider = new OpenAIProvider();
    await expect(provider.send(makeRequest(), CONFIG, 'k')).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('honours the abort signal', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          (init as RequestInit).signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError'))
          );
        })
    );

    const provider = new OpenAIProvider();
    const promise = provider.send(makeRequest({ signal: controller.signal }), CONFIG, 'k');
    controller.abort();
    await expect(promise).rejects.toMatchObject({ kind: 'cancelled' });
  });

  it('rejects a request without a key before any network call', async () => {
    fetchMock.mockRejectedValue(new Error('should not be called'));
    const provider = new OpenAIProvider();
    await expect(provider.send(makeRequest(), CONFIG, undefined)).rejects.toMatchObject({
      kind: 'not-configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Gemini provider', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the contents and the system instruction', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'It halves the interval.' }] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const provider = new GeminiProvider();
    const response = await provider.send(
      makeRequest({
        messages: [
          { id: 'm1', role: 'user', content: 'Explain binary search.', createdAt: 1 },
          { id: 'm2', role: 'assistant', content: 'It compares with the middle.', createdAt: 2 },
          { id: 'm3', role: 'user', content: 'And the complexity?', createdAt: 3 },
        ],
      }),
      { ...CONFIG, provider: 'gemini' },
      'gem-key'
    );

    expect(response.content).toContain('halves the interval');
    expect(response.provider).toBe('gemini');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('gemini-2.0-flash:generateContent');
    expect(url).toContain('key=gem-key');
    const body = JSON.parse(String(init.body));
    expect(body.systemInstruction.parts[0].text).toContain('tutor');
    // Assistant messages are mapped to the "model" role.
    const roles = body.contents.map((content: { role: string }) => content.role);
    expect(roles).toEqual(['user', 'model', 'user']);
  });

  it('maps an invalid key error', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"error":{"message":"API key not valid"}}', { status: 400 })
    );
    const provider = new GeminiProvider();
    await expect(
      provider.send(makeRequest(), { ...CONFIG, provider: 'gemini' }, 'bad')
    ).rejects.toMatchObject({ kind: 'invalid-key' });
  });

  it('maps an unsupported model error', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"error":{"message":"model not found"}}', { status: 404 })
    );
    const provider = new GeminiProvider();
    await expect(
      provider.send(makeRequest(), { ...CONFIG, provider: 'gemini' }, 'k')
    ).rejects.toMatchObject({ kind: 'unsupported-model' });
  });

  it('reports a blocked answer as malformed', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } }),
        { status: 200 }
      )
    );
    const provider = new GeminiProvider();
    await expect(
      provider.send(makeRequest(), { ...CONFIG, provider: 'gemini' }, 'k')
    ).rejects.toMatchObject({ kind: 'malformed-response' });
  });
});

describe('local knowledge provider', () => {
  const provider = new LocalKnowledgeProvider();

  it('answers offline from the bundled resources', async () => {
    const response = await provider.send(
      makeRequest({
        messages: [
          { id: 'm1', role: 'user', content: 'Explain merge sort', createdAt: 1 },
        ],
      }),
      { ...CONFIG, provider: 'local' }
    );

    expect(response.fromKnowledgeBase).toBe(true);
    expect(response.provider).toBe('local');
    expect(response.sources.length).toBeGreaterThan(0);
    expect(response.content.toLowerCase()).toContain('merge sort');
  });

  it('explains that it could not find material for an unknown question', async () => {
    const response = await provider.send(
      makeRequest({
        messages: [
          { id: 'm1', role: 'user', content: 'What is the capital of France?', createdAt: 1 },
        ],
      }),
      { ...CONFIG, provider: 'local' }
    );

    expect(response.fromKnowledgeBase).toBe(true);
    expect(response.content).toContain('could not find matching material');
  });

  it('includes explicitly shared context in the answer', async () => {
    const response = await provider.send(
      makeRequest({
        messages: [
          { id: 'm1', role: 'user', content: 'What is wrong with my code?', createdAt: 1 },
        ],
        context: [
          {
            id: 'c1',
            kind: 'diagnostics',
            label: 'Compiler diagnostics',
            content: 'error: expected ; before return',
          },
        ],
      }),
      { ...CONFIG, provider: 'local' }
    );

    expect(response.content).toContain('expected ; before return');
  });
});

describe('provider error messages', () => {
  it('explains every error kind in student-friendly language', () => {
    const kinds = [
      'not-configured',
      'invalid-key',
      'network',
      'rate-limit',
      'timeout',
      'cancelled',
      'unsupported-model',
      'empty-response',
      'malformed-response',
      'server',
    ] as const;

    for (const kind of kinds) {
      const text = describeProviderError(new AIProviderError(kind, 'internal'));
      expect(text.length).toBeGreaterThan(20);
      expect(text).not.toBe('internal');
    }
  });
});
