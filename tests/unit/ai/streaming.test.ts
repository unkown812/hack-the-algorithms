import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider } from '../../../src/core/ai/providers/OpenAIProvider';
import { GeminiProvider } from '../../../src/core/ai/providers/GeminiProvider';
import { LocalLLMProvider } from '../../../src/core/ai/providers/LocalLLMProvider';
import {
  readEventStream,
  readLineStream,
} from '../../../src/core/ai/providers/streamUtils';
import {
  DEFAULT_AI_CONFIGURATION,
  type AIChunk,
  type AIProviderConfig,
  type AIRequest,
} from '../../../src/core/ai/types';

function makeRequest(): AIRequest {
  return {
    messages: [
      { id: 'm1', role: 'user', content: 'Explain merge sort.', createdAt: 1 },
    ],
    systemPrompt: 'You are the tutor.',
    context: [],
    mode: 'beginner',
  };
}

const CONFIG: AIProviderConfig = {
  ...DEFAULT_AI_CONFIGURATION,
  provider: 'openai',
  streaming: true,
};

/** Builds a response that delivers the given events as a stream. */
function streamResponse(events: string[], contentType = 'text/event-stream'): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(event));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': contentType },
  });
}

/** Collects the chunks of a stream. */
function collect(): { chunks: AIChunk[]; texts: string[] } {
  const chunks: AIChunk[] = [];
  const texts: string[] = [];
  return {
    chunks,
    texts,
    push: (chunk: AIChunk) => {
      chunks.push(chunk);
      texts.push(chunk.text);
    },
  };
}

describe('stream helpers', () => {
  it('reads server-sent events', async () => {
    const response = streamResponse([
      'data: {"value":"1"}\n\n',
      'data: {"value":"2"}\n\n',
      'data: [DONE]\n\n',
    ]);

    const seen: string[] = [];
    const content = await readEventStream(
      response,
      { onText: (text) => seen.push(text) },
      (payload) => {
        const data = payload as { value?: string };
        return data.value;
      }
    );

    expect(seen).toEqual(['1', '2']);
    expect(content).toBe('12');
  });

  it('ignores comments and malformed payloads', async () => {
    const response = streamResponse([
      ': keep-alive\n\n',
      'data: not-json\n\n',
      'data: {"value":"ok"}\n\n',
    ]);

    const seen: string[] = [];
    await readEventStream(
      response,
      { onText: (text) => seen.push(text) },
      (payload) => (payload as { value?: string }).value
    );

    expect(seen).toEqual(['ok']);
  });

  it('reads newline-delimited JSON', async () => {
    const response = streamResponse(
      ['{"text":"Hello "}\n', '{"text":"world"}\n'],
      'application/x-ndjson'
    );

    const seen: string[] = [];
    const content = await readLineStream(
      response,
      { onText: (text) => seen.push(text) },
      (payload) => (payload as { text?: string }).text
    );

    expect(seen).toEqual(['Hello ', 'world']);
    expect(content).toBe('Hello world');
  });
});

describe('OpenAI streaming', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('delivers the answer piece by piece', async () => {
    fetchMock.mockResolvedValue(
      streamResponse([
        'data: {"choices":[{"delta":{"content":"Merge "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"sort divides "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"the array."}}]}\n\n',
        'data: [DONE]\n\n',
      ])
    );

    const provider = new OpenAIProvider();
    const chunks: AIChunk[] = [];

    const response = await provider.stream(
      makeRequest(),
      CONFIG,
      'key',
      (chunk) => chunks.push(chunk)
    );

    expect(response.content).toBe('Merge sort divides the array.');
    expect(chunks.map((chunk) => chunk.text).join('')).toBe('Merge sort divides the array.');
    expect(chunks[chunks.length - 1].done).toBe(true);

    // The request asked for a stream.
    const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body));
    expect(body.stream).toBe(true);
  });

  it('reports an empty stream', async () => {
    fetchMock.mockResolvedValue(streamResponse(['data: [DONE]\n\n']));
    const provider = new OpenAIProvider();
    await expect(
      provider.stream(makeRequest(), CONFIG, 'key', () => undefined)
    ).rejects.toMatchObject({ kind: 'empty-response' });
  });

  it('maps an invalid key while streaming', async () => {
    fetchMock.mockResolvedValue(new Response('Unauthorized', { status: 401 }));
    const provider = new OpenAIProvider();
    await expect(
      provider.stream(makeRequest(), CONFIG, 'bad', () => undefined)
    ).rejects.toMatchObject({ kind: 'invalid-key' });
  });

  it('reports that it supports streaming', () => {
    expect(new OpenAIProvider().supportsStreaming).toBe(true);
  });
});

describe('Gemini streaming', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('delivers the parts of the candidates', async () => {
    fetchMock.mockResolvedValue(
      streamResponse([
        'data: {"candidates":[{"content":{"parts":[{"text":"Half "}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"the array."}]}}]}\n\n',
      ])
    );

    const provider = new GeminiProvider();
    const chunks: string[] = [];

    const response = await provider.stream(
      makeRequest(),
      { ...CONFIG, provider: 'gemini' },
      'key',
      (chunk) => chunks.push(chunk.text)
    );

    expect(response.content).toBe('Half the array.');
    expect(chunks.join('')).toBe('Half the array.');

    const url = (fetchMock.mock.calls[0] as [string, RequestInit])[0];
    expect(url).toContain('streamGenerateContent');
    expect(url).toContain('alt=sse');
  });
});

describe('local model provider', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const LOCAL_CONFIG: AIProviderConfig = {
    ...DEFAULT_AI_CONFIGURATION,
    provider: 'local-llm',
    localBaseUrl: 'http://localhost:11434',
  };

  it('does not need a key and does not send data out of the machine', () => {
    const provider = new LocalLLMProvider();
    expect(provider.requiresKey).toBe(false);
    expect(provider.isExternal).toBe(false);
    expect(provider.supportsStreaming).toBe(true);
  });

  it('answers with the local server', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ message: { content: 'A local answer.' } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const provider = new LocalLLMProvider();
    const response = await provider.send(makeRequest(), LOCAL_CONFIG);

    expect(response.content).toBe('A local answer.');
    expect(response.provider).toBe('local-llm');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:11434/api/chat');
    expect(JSON.parse(String(init.body)).stream).toBe(false);
  });

  it('streams the answer of the local server', async () => {
    fetchMock.mockResolvedValue(
      streamResponse(
        ['{"message":{"content":"Local "}}\n', '{"message":{"content":"answer."}}\n'],
        'application/x-ndjson'
      )
    );

    const provider = new LocalLLMProvider();
    const chunks: string[] = [];

    const response = await provider.stream(
      makeRequest(),
      LOCAL_CONFIG,
      undefined,
      (chunk) => chunks.push(chunk.text)
    );

    expect(response.content).toBe('Local answer.');
    expect(chunks.join('')).toBe('Local answer.');
  });

  it('explains how to start the server when it is not reachable', async () => {
    fetchMock.mockResolvedValue(new Response('not found', { status: 404 }));
    const provider = new LocalLLMProvider();
    await expect(provider.send(makeRequest(), LOCAL_CONFIG)).rejects.toMatchObject({
      kind: 'unsupported-model',
    });
  });

  it('reports a network error when the server does not answer', async () => {
    fetchMock.mockRejectedValue(new Error('connection refused'));
    const provider = new LocalLLMProvider();
    await expect(provider.send(makeRequest(), LOCAL_CONFIG)).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('lists the models of a running server', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ models: [{ name: 'llama3.2' }, { name: 'qwen2.5' }] }),
        { status: 200 }
      )
    );

    const provider = new LocalLLMProvider();
    const models = await provider.listModels('http://localhost:11434');
    expect(models).toEqual(['llama3.2', 'qwen2.5']);
  });

  it('returns no models when no server is running', async () => {
    fetchMock.mockRejectedValue(new Error('connection refused'));
    const provider = new LocalLLMProvider();
    expect(await provider.listModels('http://localhost:11434')).toEqual([]);
  });
});
