import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AIAssistant } from '../../../src/webview/pages/AIAssistant';
import { AIMarkdown, parseMarkdown } from '../../../src/webview/components/ai/AIMarkdown';
import {
  AIMessageView,
  AIContextPanel,
  AIConversationList,
} from '../../../src/webview/components/ai/AIMessage';
import {
  AIModeSelector,
  AIProviderSettings,
  AIQuickActions,
} from '../../../src/webview/components/ai/AIProviderSettings';
import type {
  AIMessage as AIMessageModel,
  AIProviderConfig,
  AIProviderStatus,
} from '../../../src/core/ai/types';

const render = (element: JSX.Element): string => renderToStaticMarkup(element);

const CONFIG: AIProviderConfig = {
  provider: 'openai',
  model: '',
  temperature: 0.4,
  maxTokens: 1500,
  timeoutMs: 60000,
  maxContextMessages: 12,
  maxContextCharacters: 12000,
  useLocalResources: true,
  allowExternalContext: false,
};

const STATUSES: AIProviderStatus[] = [
  {
    id: 'local',
    name: 'Local knowledge base',
    hasKey: false,
    defaultModel: 'bundled-resources',
    models: ['bundled-resources'],
    requiresKey: false,
    isExternal: false,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    hasKey: true,
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o'],
    requiresKey: true,
    isExternal: true,
    documentationUrl: 'https://platform.openai.com/docs',
  },
];

describe('AI assistant page renders', () => {
  it('renders the welcome screen and the quick actions', () => {
    const markup = render(<AIAssistant onBack={() => undefined} />);

    expect(markup).toContain('DAA Learning Assistant');
    expect(markup).toContain('What would you like to understand today?');
    expect(markup).toContain('Algorithm Tutor');
    expect(markup).toContain('Code Explainer');
    expect(markup).toContain('Debugging Assistant');
    expect(markup).toContain('Complexity Tutor');
  });

  it('shows that the local knowledge base works without a key', () => {
    const markup = render(<AIAssistant onBack={() => undefined} />);
    expect(markup).toContain('local knowledge base answers from the bundled material');
  });

  it('renders every explanation mode', () => {
    const markup = render(
      <AIModeSelector mode="beginner" onChange={() => undefined} />
    );
    expect(markup).toContain('Beginner');
    expect(markup).toContain('Detailed');
    expect(markup).toContain('Step by step');
    expect(markup).toContain('Exam preparation');
    expect(markup).toContain('Practical');
    expect(markup).toContain('Interview');
    expect(markup).toContain('Visual learning');
  });
});

describe('AI markdown renderer', () => {
  it('parses the block types of an answer', () => {
    const blocks = parseMarkdown(
      [
        '# Heading',
        '',
        'A paragraph with **bold** and `code`.',
        '',
        '- first item',
        '- second item',
        '',
        '```c',
        'int main(void) { return 0; }',
        '```',
        '',
        '| A | B |',
        '| - | - |',
        '| 1 | 2 |',
      ].join('\n')
    );

    const kinds = blocks.map((block) => block.kind);
    expect(kinds).toContain('heading');
    expect(kinds).toContain('paragraph');
    expect(kinds).toContain('list');
    expect(kinds).toContain('code');
    expect(kinds).toContain('table');
  });

  it('renders code blocks with a copy button', () => {
    const markup = render(<AIMarkdown content={'```c\nint x = 1;\n```'} />);
    expect(markup).toContain('int x = 1;');
    expect(markup).toContain('Copy');
  });

  it('renders inline formatting', () => {
    const markup = render(<AIMarkdown content="A **bold** word and a `code` word." />);
    expect(markup).toContain('<strong');
    expect(markup).toContain('<code');
  });

  it('never renders raw HTML from the answer', () => {
    const markup = render(
      <AIMarkdown content={'<img src=x onerror="alert(1)"> and <script>alert(2)</script>'} />
    );
    expect(markup).not.toContain('<img');
    expect(markup).not.toContain('<script');
  });
});

describe('AI message components', () => {
  const message: AIMessageModel = {
    id: 'm1',
    role: 'assistant',
    content: 'Merge sort divides the array in half.',
    createdAt: 1,
    sources: [{ title: 'Merge Sort — theory', origin: 'Algorithm registry', reference: 'merge-sort' }],
    fromKnowledgeBase: true,
  };

  it('shows the sources and the knowledge-base badge', () => {
    const markup = render(<AIMessageView message={message} />);
    expect(markup).toContain('Merge sort divides the array in half.');
    expect(markup).toContain('Merge Sort — theory');
    expect(markup).toContain('Algorithm registry');
    expect(markup).toContain('Local knowledge base');
  });

  it('shows a question in the user style', () => {
    const markup = render(
      <AIMessageView
        message={{ id: 'u1', role: 'user', content: 'Why O(n log n)?', createdAt: 1 }}
      />
    );
    expect(markup).toContain('Why O(n log n)?');
  });

  it('shows the attached context items', () => {
    const markup = render(
      <AIContextPanel
        items={[
          { id: 'c1', kind: 'code', label: 'Selected code — main.c', source: 'User selection' },
          { id: 'c2', kind: 'algorithm', label: 'Algorithm — Merge Sort', source: 'Algorithm registry' },
        ]}
        onRemove={() => undefined}
      />
    );
    expect(markup).toContain('Selected code — main.c');
    expect(markup).toContain('Algorithm — Merge Sort');
  });

  it('marks a withheld context', () => {
    const markup = render(
      <AIContextPanel
        items={[{ id: 'c1', kind: 'code', label: 'Selected code — main.c' }]}
        onRemove={() => undefined}
        withheld
      />
    );
    expect(markup).toContain('not sent');
  });

  it('renders the conversation list', () => {
    const markup = render(
      <AIConversationList
        conversations={[{ id: 'c1', title: 'Merge sort', messageCount: 4, updatedAt: 2 }]}
        onOpen={() => undefined}
        onDelete={() => undefined}
        onNew={() => undefined}
        onClear={() => undefined}
      />
    );
    expect(markup).toContain('Merge sort');
    expect(markup).toContain('New chat');
  });
});

describe('AI provider settings', () => {
  it('shows the providers, the consent switch and the connection test', () => {
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

    expect(markup).toContain('OpenAI');
    expect(markup).toContain('external service');
    expect(markup).toContain('Allow the selected context');
    expect(markup).toContain('Test connection');
    expect(markup).toContain('stored in the VS Code secret storage');
  });

  it('does not offer the key field for the local provider', () => {
    const markup = render(
      <AIProviderSettings
        statuses={STATUSES}
        config={{ ...CONFIG, provider: 'local' }}
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

  it('shows the result of the connection test', () => {
    const markup = render(
      <AIProviderSettings
        statuses={STATUSES}
        config={CONFIG}
        onSaveConfig={() => undefined}
        onSaveKey={() => undefined}
        onClearKey={() => undefined}
        onTest={() => undefined}
        testResult={{ ok: true, message: 'Connected to OpenAI (gpt-4o-mini).' }}
        onClose={() => undefined}
      />
    );
    expect(markup).toContain('Connected to OpenAI');
  });

  it('renders every quick action', () => {
    const markup = render(<AIQuickActions onPick={() => undefined} />);
    expect(markup).toContain('Visualization Assistant');
    expect(markup).toContain('Practical &amp; Viva');
  });
});
