import { describe, expect, it, vi } from 'vitest';
import { AIContextBuilder, type ContextSelection } from '../../../src/core/ai/AIContextBuilder';
import {
  AIRetrievalService,
  retrievalService,
  tokenize,
} from '../../../src/core/ai/AIRetrievalService';
import { AIResponseValidator } from '../../../src/core/ai/AIResponseValidator';
import { AIConversationManager } from '../../../src/core/ai/AIConversationManager';
import { AIService } from '../../../src/core/ai/AIService';
import { AIProviderError } from '../../../src/core/ai/AIProvider';
import type { AIProvider } from '../../../src/core/ai/AIProvider';
import {
  DEFAULT_AI_CONFIGURATION,
  type AIProviderConfig,
  type AIRequest,
  type AIResponse,
} from '../../../src/core/ai/types';

const ALGORITHM_SELECTION: ContextSelection = {
  algorithmId: 'merge-sort',
};

const CODE_SELECTION: ContextSelection = {
  code: 'int main(void) { return 0; }',
  codeFileName: 'main.c',
};

const EXECUTION_SELECTION: ContextSelection = {
  execution: {
    status: 'crashed',
    stdout: '',
    stderr: 'Segmentation fault (core dumped)',
    exitCode: 139,
    durationMs: 12,
  },
};

const COMPLEXITY_SELECTION: ContextSelection = {
  complexity: {
    theoretical: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', auxiliary: 'O(n)' },
    instrumented: { comparisons: 17, swaps: 12, totalOperations: 29 },
    measured: { meanTimeMs: 0.42, trials: 5 },
  },
};

function config(overrides: Partial<AIProviderConfig> = {}): AIProviderConfig {
  return { ...DEFAULT_AI_CONFIGURATION, ...overrides };
}

describe('context builder', () => {
  const builder = new AIContextBuilder();

  it('builds the algorithm context from the registry', () => {
    const built = builder.build(ALGORITHM_SELECTION, 'explain merge sort', config());
    const item = built.items.find((entry) => entry.kind === 'algorithm');

    expect(item).toBeDefined();
    expect(item?.content).toContain('Merge Sort');
    expect(item?.content.toLowerCase()).toContain('o(n log n)');
    expect(item?.source).toBe('Algorithm registry');
  });

  it('builds the code context with the file name', () => {
    const built = builder.build(CODE_SELECTION, 'explain this code', config());
    const item = built.items.find((entry) => entry.kind === 'code');

    expect(item?.label).toContain('main.c');
    expect(item?.content).toContain('int main');
  });

  it('builds the execution context with the real evidence', () => {
    const built = builder.build(EXECUTION_SELECTION, 'why did it crash?', config());
    const item = built.items.find((entry) => entry.kind === 'execution');

    expect(item?.content).toContain('Segmentation fault');
    expect(item?.content).toContain('139');
  });

  it('keeps the theoretical class, the counts and the measurement apart', () => {
    const built = builder.build(COMPLEXITY_SELECTION, 'why o(n log n)?', config());
    const item = built.items.find((entry) => entry.kind === 'complexity');

    expect(item?.content).toContain('Theoretical complexity:');
    expect(item?.content).toContain('O(n log n)');
    expect(item?.content).toContain('Instrumented operation counts');
    expect(item?.content).toContain('Comparisons: 17');
    expect(item?.content).toContain('Measured running time');
    expect(item?.content).toContain('trials');
  });

  it('ignores an unknown algorithm id silently', () => {
    const built = builder.build({ algorithmId: 'no-such-algorithm' }, 'explain', config());
    expect(built.items.find((entry) => entry.kind === 'algorithm')).toBeUndefined();
  });

  it('respects the context budget and reports the truncation', () => {
    const built = builder.build(
      { ...CODE_SELECTION, code: 'x'.repeat(40000) },
      'explain',
      config({ maxContextCharacters: 1000 })
    );

    expect(built.truncated).toBe(true);
    expect(built.characters).toBeLessThanOrEqual(1000);
  });

  it('skips retrieval when the configuration says so', () => {
    const built = builder.build({}, 'explain merge sort', config({ useLocalResources: false }));
    expect(built.documents).toHaveLength(0);
  });

  it('retrieves matching documents for the question', () => {
    const built = builder.build({}, 'explain quick sort', config());
    expect(built.documents.length).toBeGreaterThan(0);
    expect(built.documents.some((document) => document.reference?.includes('quick'))).toBe(true);
  });
});

describe('retrieval service', () => {
  it('tokenizes a question into meaningful words', () => {
    expect(tokenize('Why is the Merge Sort O(n log n)?')).toContain('merge');
    expect(tokenize('Why is the Merge Sort O(n log n)?')).not.toContain('the');
  });

  it('finds the right algorithm for a natural question', () => {
    const results = retrievalService.search('Why is binary search faster than linear search?');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].reference).toMatch(/binary-search|linear-search/);
  });

  it('returns nothing without terms', () => {
    expect(retrievalService.search('')).toHaveLength(0);
  });

  it('filters by kind', () => {
    const results = retrievalService.search('merge sort', { kinds: ['practical'] });
    for (const result of results) {
      expect(result.kind).toBe('practical');
    }
  });

  it('returns the algorithm documents by reference', () => {
    const documents = retrievalService.getAlgorithmDocuments('bubble-sort');
    expect(documents.length).toBeGreaterThanOrEqual(2);
    expect(documents.some((document) => document.kind === 'algorithm')).toBe(true);
    expect(documents.some((document) => document.kind === 'complexity')).toBe(true);
  });

  it('the service instance exposes the same corpus as the builder', () => {
    const service = new AIRetrievalService();
    const documents = service.getByKind('viva');
    expect(documents.length).toBeGreaterThan(0);
  });
});

describe('response validator', () => {
  const validator = new AIResponseValidator();

  const base: AIResponse = {
    content: 'Answer',
    provider: 'openai',
    model: 'gpt-4o-mini',
    sources: [],
    fromKnowledgeBase: false,
    durationMs: 5,
    usedContext: [],
  };

  it('rejects an empty answer', () => {
    const result = validator.validate({ ...base, content: '' }, []);
    expect(result.valid).toBe(false);
  });

  it('flags a claimed compilation when no execution context exists', () => {
    const result = validator.validate(
      { ...base, content: 'I compiled your program and it works.' },
      []
    );
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('compiled or executed');
  });

  it('allows the claim when a real execution result was shared', () => {
    const result = validator.validate(
      { ...base, content: 'I compiled your program and it works.' },
      [{ id: 'c', kind: 'execution', label: 'Execution result', content: 'status: crashed' }]
    );
    expect(result.warnings).toHaveLength(0);
  });

  it('flags invented operation counts', () => {
    const result = validator.validate(
      { ...base, content: 'I counted 42 comparisons.' },
      []
    );
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('allows operation claims when instrumented counts were shared', () => {
    const result = validator.validate(
      { ...base, content: 'I counted 42 comparisons.' },
      [{ id: 'c', kind: 'complexity', label: 'Complexity analysis', content: 'Comparisons: 42' }]
    );
    expect(result.warnings).toHaveLength(0);
  });

  it('warns about answers without any verified material', () => {
    const result = validator.validate(
      { ...base, content: 'Merge sort divides the array.' },
      []
    );
    expect(result.warnings.some((warning) => warning.includes('without any verified material'))).toBe(true);
  });

  it('accepts an offline answer with sources', () => {
    const result = validator.validate(
      { ...base, content: 'Merge sort divides the array.', fromKnowledgeBase: true, sources: [{ title: 'Merge Sort', origin: 'Algorithm registry' }] },
      []
    );
    expect(result.warnings).toHaveLength(0);
  });
});

describe('conversation manager', () => {
  it('creates a conversation and sets the title from the first message', () => {
    const manager = new AIConversationManager();
    const conversation = manager.create();
    expect(conversation.title).toBe('New conversation');

    manager.addMessage(conversation.id, { role: 'user', content: 'Why is quick sort O(n log n) on average?' });
    const stored = manager.get(conversation.id);
    expect(stored?.title).toContain('Why is quick sort');
    expect(stored?.messages).toHaveLength(1);
  });

  it('lists conversations newest first', () => {
    const manager = new AIConversationManager();
    const first = manager.create();
    const second = manager.create();
    manager.addMessage(first.id, { role: 'user', content: 'first', createdAt: 2 });
    manager.addMessage(second.id, { role: 'user', content: 'second', createdAt: 3 });

    const list = manager.list();
    expect(list[0].updatedAt).toBeGreaterThanOrEqual(list[1].updatedAt);
  });

  it('changes the mode and removes conversations', () => {
    const manager = new AIConversationManager();
    const conversation = manager.create('beginner');
    expect(manager.setMode(conversation.id, 'exam')).toBe(true);
    expect(manager.get(conversation.id)?.mode).toBe('exam');
    expect(manager.remove(conversation.id)).toBe(true);
    expect(manager.get(conversation.id)).toBeUndefined();
    expect(manager.remove(conversation.id)).toBe(false);
  });

  it('clears everything', () => {
    const manager = new AIConversationManager();
    manager.create();
    manager.create();
    manager.clear();
    expect(manager.list()).toHaveLength(0);
  });
});

/** A configurable provider stub for the service tests. */
function stubProvider(overrides: Partial<AIProvider> = {}): AIProvider {
  return {
    id: 'openai',
    name: 'OpenAI',
    requiresKey: true,
    isExternal: true,
    defaultModel: 'test-model',
    models: ['test-model'],
    getStatus: () => ({
      id: 'openai',
      name: 'OpenAI',
      hasKey: true,
      defaultModel: 'test-model',
      models: ['test-model'],
      requiresKey: true,
      isExternal: true,
    }),
    send: vi.fn(async () => ({
      content: 'The answer from the stub.',
      provider: 'openai',
      model: 'test-model',
      sources: [],
      fromKnowledgeBase: false,
      durationMs: 1,
      usedContext: [],
    })),
    ...overrides,
  } as AIProvider;
}

describe('AI service', () => {
  it('answers through the configured provider and records the conversation', async () => {
    const provider = stubProvider();
    const service = new AIService(() => ({ provider, apiKey: 'key' }), () => config());

    const result = await service.ask({ question: 'Explain bubble sort.' });

    expect(result.response.content).toContain('stub');
    expect(result.contextWithheld).toBe(false);
    expect(result.conversationId).toBeTruthy();
    expect(service.conversations.messages(result.conversationId)).toHaveLength(2);
    expect(service.conversations.messages(result.conversationId)[0].content).toBe('Explain bubble sort.');
    expect(service.conversations.messages(result.conversationId)[1].role).toBe('assistant');
  });

  it('withholds user context from an external provider without consent', async () => {
    let receivedRequest: AIRequest | undefined;
    const provider = stubProvider({
      send: vi.fn(async (request: AIRequest) => {
        receivedRequest = request;
        return {
          content: 'ok',
          provider: 'openai',
          model: 'm',
          sources: [],
          fromKnowledgeBase: false,
          durationMs: 1,
          usedContext: request.context,
        };
      }),
    });

    const service = new AIService(
      () => ({ provider, apiKey: 'key' }),
      () => config({ provider: 'openai', allowExternalContext: false })
    );

    const result = await service.ask({
      question: 'Why does my code crash?',
      selection: { ...EXECUTION_SELECTION, code: 'int main(){ *(int*)0 = 1; }' },
    });

    expect(result.contextWithheld).toBe(true);
    expect(receivedRequest?.context.some((item) => item.kind === 'execution')).toBe(false);
    expect(receivedRequest?.context.some((item) => item.kind === 'code')).toBe(false);
  });

  it('sends the context with consent', async () => {
    let receivedRequest: AIRequest | undefined;
    const provider = stubProvider({
      send: vi.fn(async (request: AIRequest) => {
        receivedRequest = request;
        return {
          content: 'ok',
          provider: 'openai',
          model: 'm',
          sources: [],
          fromKnowledgeBase: false,
          durationMs: 1,
          usedContext: request.context,
        };
      }),
    });

    const service = new AIService(
      () => ({ provider, apiKey: 'key' }),
      () => config({ provider: 'openai', allowExternalContext: true })
    );

    const result = await service.ask({
      question: 'Why does my code crash?',
      selection: EXECUTION_SELECTION,
    });

    expect(result.contextWithheld).toBe(false);
    expect(receivedRequest?.context.some((item) => item.kind === 'execution')).toBe(true);
  });

  it('never withholds context for a local provider', async () => {
    const provider = stubProvider({
      isExternal: false,
      send: vi.fn(async (request: AIRequest) => ({
        content: 'ok',
        provider: 'openai',
        model: 'm',
        sources: [],
        fromKnowledgeBase: true,
        durationMs: 1,
        usedContext: request.context,
      })),
    });

    const service = new AIService(
      () => ({ provider }),
      () => config({ provider: 'openai', allowExternalContext: false })
    );

    const result = await service.ask({
      question: 'Why?',
      selection: EXECUTION_SELECTION,
    });

    expect(result.contextWithheld).toBe(false);
  });

  it('reports a not-configured provider as a provider error', async () => {
    const service = new AIService(() => undefined, () => config({ provider: 'gemini' }));
    await expect(service.ask({ question: 'Hello?' })).rejects.toMatchObject({
      kind: 'not-configured',
    });
  });

  it('resumes an existing conversation', async () => {
    const provider = stubProvider();
    const service = new AIService(() => ({ provider, apiKey: 'key' }), () => config());

    const first = await service.ask({ question: 'First question' });
    await service.ask({ question: 'Second question', conversationId: first.conversationId });

    const messages = service.conversations.messages(first.conversationId);
    expect(messages).toHaveLength(4);
    expect(messages.map((message) => message.content)).toContain('First question');
    expect(messages.map((message) => message.content)).toContain('Second question');
  });

  it('stores the provider error in the conversation', async () => {
    const provider = stubProvider({
      send: vi.fn(async () => {
        throw new AIProviderError('rate-limit', 'Too many requests.', 30);
      }),
    });
    const service = new AIService(() => ({ provider, apiKey: 'key' }), () => config());

    await expect(service.ask({ question: 'Hello' })).rejects.toMatchObject({ kind: 'rate-limit' });

    const conversations = service.conversations.list();
    const messages = service.conversations.messages(conversations[0].id);
    expect(messages[messages.length - 1].error).toBe(true);
  });

  it('recovers from a stale conversation id', async () => {
    const provider = stubProvider();
    const service = new AIService(() => ({ provider, apiKey: 'key' }), () => config());

    const result = await service.ask({
      question: 'Hello',
      conversationId: 'conversation-that-does-not-exist',
    });

    expect(result.conversationId).not.toBe('conversation-that-does-not-exist');
    expect(service.conversations.messages(result.conversationId)).toHaveLength(2);
  });

  it('suggests questions, including one for the current algorithm', () => {
    const service = new AIService(() => undefined, () => config());
    const suggestions = service.getSuggestions({ algorithmId: 'merge-sort' });
    expect(suggestions[0].text.toLowerCase()).toContain('merge sort');
    expect(suggestions.length).toBeGreaterThan(4);
  });
});
