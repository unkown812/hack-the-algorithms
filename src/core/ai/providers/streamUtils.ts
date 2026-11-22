import { AIProviderError } from '../AIProvider';

/**
 * Helpers for reading streamed provider responses.
 *
 * Both OpenAI and Gemini deliver their streams as server-sent events: a
 * sequence of `data: {...}` lines separated by a blank line, terminated by
 * `data: [DONE]`. The helper below turns such a response into plain text
 * chunks and keeps the error handling of the non-streaming path identical.
 */

export interface StreamHandlers {
  /** Called for every text fragment. */
  onText: (text: string) => void;
}

/**
 * Reads a `text/event-stream` response and calls the handler for every
 * `data:` payload that carries text.
 *
 * The parser is deliberately tolerant: it ignores comments, keeps the last
 * incomplete line in the buffer and treats an empty payload as the end of
 * the stream.
 */
export async function readEventStream(
  response: Response,
  handlers: StreamHandlers,
  extract: (payload: unknown) => string | undefined
): Promise<string> {
  const body = response.body;
  if (!body) {
    throw new AIProviderError('malformed-response', 'The provider returned no stream.');
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Events are separated by a blank line.
      let separator = buffer.indexOf('\n\n');
      while (separator !== -1) {
        const event = buffer.slice(0, separator);
        buffer = buffer.slice(separator + 2);
        const text = handleEvent(event, extract);
        if (text !== undefined) {
          content += text;
          handlers.onText(text);
        }
        separator = buffer.indexOf('\n\n');
      }
    }

    // A last event without the trailing blank line.
    const tail = handleEvent(buffer, extract);
    if (tail !== undefined) {
      content += tail;
      handlers.onText(tail);
    }
  } catch (error) {
    if (error instanceof AIProviderError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AIProviderError('cancelled', 'The request was cancelled.');
    }
    throw new AIProviderError('network', error instanceof Error ? error.message : 'Network error');
  } finally {
    reader.releaseLock();
  }

  return content;
}

/** Handles one server-sent event and returns the text it carries. */
function handleEvent(event: string, extract: (payload: unknown) => string | undefined): string | undefined {
  const lines = event.split('\n');
  const data: string[] = [];

  for (const line of lines) {
    if (line.startsWith('data:')) {
      data.push(line.slice(5).trim());
    }
  }

  if (data.length === 0) {
    return undefined;
  }

  const payload = data.join('\n');
  if (payload === '[DONE]') {
    return undefined;
  }

  try {
    return extract(JSON.parse(payload));
  } catch {
    // A fragment that is not JSON carries no text.
    return undefined;
  }
}

/**
 * Reads a newline-delimited JSON stream (the format of a local Ollama
 * server) and calls the handler for every text fragment.
 */
export async function readLineStream(
  response: Response,
  handlers: StreamHandlers,
  extract: (payload: unknown) => string | undefined
): Promise<string> {
  const body = response.body;
  if (!body) {
    throw new AIProviderError('malformed-response', 'The provider returned no stream.');
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let newline = buffer.indexOf('\n');
      while (newline !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) {
          try {
            const text = extract(JSON.parse(line));
            if (text !== undefined && text !== '') {
              content += text;
              handlers.onText(text);
            }
          } catch {
            // A malformed line carries no text.
          }
        }
        newline = buffer.indexOf('\n');
      }
    }

    const tail = buffer.trim();
    if (tail) {
      try {
        const text = extract(JSON.parse(tail));
        if (text !== undefined && text !== '') {
          content += text;
          handlers.onText(text);
        }
      } catch {
        // Ignore the remainder.
      }
    }
  } catch (error) {
    if (error instanceof AIProviderError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AIProviderError('cancelled', 'The request was cancelled.');
    }
    throw new AIProviderError('network', error instanceof Error ? error.message : 'Network error');
  } finally {
    reader.releaseLock();
  }

  return content;
}

/**
 * Creates the abort controller of a request and the timer of the timeout.
 * The caller has to call `dispose` in a `finally` block.
 */
export function createRequestControl(
  signal: AbortSignal | undefined,
  timeoutMs: number
): { controller: AbortController; dispose: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = (): void => controller.abort();
  signal?.addEventListener('abort', onAbort);

  return {
    controller,
    dispose: () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    },
  };
}

/**
 * Turns a fetch failure into the matching provider error.
 * A timeout is reported separately from a cancellation.
 */
export function toProviderError(error: unknown, signal: AbortSignal | undefined): AIProviderError {
  if (error instanceof AIProviderError) {
    return error;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    if (signal?.aborted) {
      return new AIProviderError('cancelled', 'The request was cancelled.');
    }
    return new AIProviderError('timeout', 'The provider did not answer in time.');
  }
  return new AIProviderError('network', error instanceof Error ? error.message : 'Network error');
}
