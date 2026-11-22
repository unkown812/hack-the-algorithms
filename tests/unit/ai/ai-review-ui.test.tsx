import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AIQuestionReview } from '../../../src/webview/components/ai/AIQuestionReview';
import { AIContextPanel } from '../../../src/webview/components/ai/AIMessage';
import { AIProviderSettings } from '../../../src/webview/components/ai/AIProviderSettings';
import { AIContextPublisher } from '../../../src/webview/components/ai/AIContextPublisher';
import type { AIQuestionDraft } from '../../../src/core/ai/types';
import type { AIProviderConfig, AIProviderStatus } from '../../../src/core/ai/types';

const render = (element: JSX.Element): string => renderToStaticMarkup(element);

const DRAFT: AIQuestionDraft = {
  id: 'draft-1',
  title: 'Stable sorting',
  category: 'sorting',
  topic: 'sorting',
  difficulty: 'intermediate',
  type: 'mcq',
  question: 'Which sorting algorithm is stable?',
  options: ['Quick sort', 'Merge sort'],
  correctAnswer: 'Merge sort',
  explanation: 'Merge sort preserves the relative order of equal elements.',
  tags: [],
  provider: 'openai',
  createdAt: 1,
  status: 'pending',
  issues: [],
};

describe('question review', () => {
  it('shows a pending draft with its answer and explanation', () => {
    const markup = render(
      <AIQuestionReview
        drafts={[DRAFT]}
        onApprove={() => undefined}
        onReject={() => undefined}
        onDelete={() => undefined}
        onClearRejected={() => undefined}
        onClose={() => undefined}
      />
    );

    expect(markup).toContain('Generated questions');
    expect(markup).toContain('Stable sorting');
    expect(markup).toContain('Which sorting algorithm is stable?');
    expect(markup).toContain('Merge sort');
    expect(markup).toContain('preserves the relative order');
    expect(markup).toContain('Approve');
    expect(markup).toContain('Reject');
  });

  it('marks the correct option', () => {
    const markup = render(
      <AIQuestionReview
        drafts={[DRAFT]}
        onApprove={() => undefined}
        onReject={() => undefined}
        onDelete={() => undefined}
        onClearRejected={() => undefined}
        onClose={() => undefined}
      />
    );
    expect(markup).toContain('✓');
  });

  it('shows an approved draft as usable', () => {
    const markup = render(
      <AIQuestionReview
        drafts={[{ ...DRAFT, status: 'approved' }]}
        onApprove={() => undefined}
        onReject={() => undefined}
        onDelete={() => undefined}
        onClearRejected={() => undefined}
        onClose={() => undefined}
      />
    );
    expect(markup).toContain('usable in quizzes');
    expect(markup).not.toContain('Approve');
  });

  it('reports the questions that did not pass the validation', () => {
    const markup = render(
      <AIQuestionReview
        drafts={[]}
        rejected={[{ title: 'Broken', issues: ['The answer is not among the options.'] }]}
        onApprove={() => undefined}
        onReject={() => undefined}
        onDelete={() => undefined}
        onClearRejected={() => undefined}
        onClose={() => undefined}
      />
    );
    expect(markup).toContain('discarded');
    expect(markup).toContain('The answer is not among the options.');
  });

  it('explains the empty state', () => {
    const markup = render(
      <AIQuestionReview
        drafts={[]}
        onApprove={() => undefined}
        onReject={() => undefined}
        onDelete={() => undefined}
        onClearRejected={() => undefined}
        onClose={() => undefined}
      />
    );
    expect(markup).toContain('No generated questions yet');
  });
});

describe('context panel', () => {
  it('offers the available context of the other pages', () => {
    const markup = render(
      <AIContextPanel
        items={[]}
        available={[
          { id: 'algorithm-merge-sort', label: 'Algorithm — Merge Sort', origin: 'visualizer' },
          { id: 'visualization-merge-sort', label: 'Visualization step — Merge Sort', origin: 'visualizer' },
        ]}
        onAttach={() => undefined}
        onRemove={() => undefined}
      />
    );

    expect(markup).toContain('Available:');
    expect(markup).toContain('+ Algorithm — Merge Sort');
    expect(markup).toContain('+ Visualization step — Merge Sort');
  });

  it('shows the attached context and allows removing it', () => {
    const markup = render(
      <AIContextPanel
        items={[{ id: 'algorithm-merge-sort', label: 'Algorithm — Merge Sort', kind: 'algorithm' }]}
        onAttach={() => undefined}
        onRemove={() => undefined}
      />
    );

    expect(markup).toContain('Context:');
    expect(markup).toContain('Algorithm — Merge Sort');
  });

  it('hides an item that is already attached from the available list', () => {
    const markup = render(
      <AIContextPanel
        items={[{ id: 'algorithm-merge-sort', label: 'Algorithm — Merge Sort', kind: 'algorithm' }]}
        available={[{ id: 'algorithm-merge-sort', label: 'Algorithm — Merge Sort', origin: 'visualizer' }]}
        onAttach={() => undefined}
        onRemove={() => undefined}
      />
    );

    expect(markup).not.toContain('+ Algorithm — Merge Sort');
  });
});

describe('provider settings', () => {
  const STATUSES: AIProviderStatus[] = [
    {
      id: 'local',
      name: 'Local knowledge base',
      hasKey: false,
      defaultModel: 'bundled-resources',
      models: ['bundled-resources'],
      requiresKey: false,
      isExternal: false,
      supportsStreaming: false,
    },
    {
      id: 'local-llm',
      name: 'Local model (Ollama compatible)',
      hasKey: false,
      defaultModel: 'llama3.2',
      models: ['llama3.2', 'qwen2.5'],
      requiresKey: false,
      isExternal: false,
      supportsStreaming: true,
      endpoint: 'http://localhost:11434',
    },
  ];

  const CONFIG: AIProviderConfig = {
    provider: 'local-llm',
    model: '',
    temperature: 0.4,
    maxTokens: 1500,
    timeoutMs: 60000,
    maxContextMessages: 12,
    maxContextCharacters: 12000,
    useLocalResources: true,
    allowExternalContext: false,
    streaming: true,
    localBaseUrl: 'http://localhost:11434',
  };

  it('offers the local model server with its address', () => {
    const markup = render(
      <AIProviderSettings
        statuses={STATUSES}
        config={CONFIG}
        onSaveConfig={() => undefined}
        onSaveKey={() => undefined}
        onClearKey={() => undefined}
        onTest={() => undefined}
        testResult={null}
        onClose={() => undefined}
      />
    );

    expect(markup).toContain('Local model (Ollama compatible)');
    expect(markup).toContain('http://localhost:11434');
    expect(markup).toContain('The request never leaves your machine.');
    expect(markup).toContain('llama3.2');
  });

  it('offers the streaming switch', () => {
    const markup = render(
      <AIProviderSettings
        statuses={STATUSES}
        config={CONFIG}
        onSaveConfig={() => undefined}
        onSaveKey={() => undefined}
        onClearKey={() => undefined}
        onTest={() => undefined}
        testResult={null}
        onClose={() => undefined}
      />
    );
    expect(markup).toContain('piece by piece');
  });

  it('reports whether the selected provider streams', () => {
    const markup = render(
      <AIProviderSettings
        statuses={STATUSES}
        config={CONFIG}
        onSaveConfig={() => undefined}
        onSaveKey={() => undefined}
        onClearKey={() => undefined}
        onTest={() => undefined}
        testResult={null}
        onClose={() => undefined}
      />
    );
    expect(markup).toContain('delivers the answer piece by piece');
    expect(markup).toContain('Server: http://localhost:11434');
  });

  it('does not ask for a key for a local provider', () => {
    const markup = render(
      <AIProviderSettings
        statuses={STATUSES}
        config={CONFIG}
        onSaveConfig={() => undefined}
        onSaveKey={() => undefined}
        onClearKey={() => undefined}
        onTest={() => undefined}
        testResult={null}
        onClose={() => undefined}
      />
    );
    expect(markup).not.toContain('Paste your API key');
  });
});

describe('context publisher', () => {
  it('renders nothing on its own', () => {
    const markup = render(<AIContextPublisher origin="test" />);
    expect(markup).toBe('');
  });
});
