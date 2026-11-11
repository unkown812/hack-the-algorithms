import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../components/Theme';
import { aiApi, useAIMessages } from '../hooks/useAI';
import {
  AIMessageView,
  AISuggestionChips,
  AIConversationList,
  AIContextPanel,
} from '../components/ai/AIMessage';
import {
  AIModeSelector,
  AIProviderSettings,
  AIQuickActions,
} from '../components/ai/AIProviderSettings';
import type {
  AIConversation,
  AIContextItem,
  AIMessage as AIMessageModel,
  AIProviderConfig,
  AIProviderStatus,
  ExplanationMode,
} from '../../core/ai/types';
import type { ContextSelection } from '../../core/ai/AIContextBuilder';

interface ContextDraft {
  items: AIContextItem[];
  /** The structured selection the host rebuilds the context from. */
  selection: ContextSelection;
}

interface AIAssistantProps {
  onBack: () => void;
  /** A code action that was started from the VS Code editor. */
  editorRequest?: { action: string; code: string; fileName: string } | undefined;
  /** Called once the editor request was applied to the chat. */
  onEditorRequestHandled?: () => void;
}

/**
 * The AI learning assistant page.
 *
 * The chat lives here; every context item that is attached has been picked
 * explicitly by the student, and the panel at the bottom shows exactly what
 * will be shared before the question is sent.
 */
export const AIAssistant: FunctionComponent<AIAssistantProps> = ({
  onBack,
  editorRequest,
  onEditorRequestHandled,
}) => {
  const [conversation, setConversation] = useState<AIConversation | undefined>(undefined);
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; messageCount: number; updatedAt: number; mode?: string }>>([]);
  const [messages, setMessages] = useState<AIMessageModel[]>([]);
  const [mode, setMode] = useState<ExplanationMode>('beginner');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; text: string }>>([]);
  const [statuses, setStatuses] = useState<AIProviderStatus[]>([]);
  const [config, setConfig] = useState<AIProviderConfig | null>(null);
  const [issues, setIssues] = useState<Array<{ field: string; message: string }>>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [contextDraft, setContextDraft] = useState<ContextDraft>({ items: [], selection: {} });
  const [includeProgress, setIncludeProgress] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handleMessages = useCallback(
    (type: string, payload: Record<string, unknown>) => {
      switch (type) {
      case 'AI_STATUS': {
        setStatuses((payload.statuses as AIProviderStatus[]) ?? []);
        setConfig((payload.config as AIProviderConfig) ?? null);
        setIssues((payload.issues as Array<{ field: string; message: string }>) ?? []);
        break;
      }
      case 'AI_CONFIG_SAVED':
      case 'AI_KEY_SAVED': {
        if (payload.statuses) {
          setStatuses(payload.statuses as AIProviderStatus[]);
        }
        if (payload.config) {
          setConfig(payload.config as AIProviderConfig);
        }
        if (payload.issues) {
          setIssues(payload.issues as Array<{ field: string; message: string }>);
        }
        break;
      }
      case 'AI_TEST_RESULT': {
        setTestResult({ ok: Boolean(payload.ok), message: String(payload.message ?? '') });
        break;
      }
      case 'AI_RESPONSE_STARTED': {
        setBusy(true);
        setRequestId(String(payload.requestId ?? ''));
        break;
      }
      case 'AI_RESPONSE': {
        setBusy(false);
        setRequestId(undefined);
        setConversation({ id: String(payload.conversationId), messages: [], createdAt: 0, updatedAt: 0, title: '', mode } as AIConversation);
        const response = payload.response as { content: string; sources?: unknown[]; fromKnowledgeBase?: boolean; provider: string; model: string } | undefined;
        if (response) {
          setMessages((previous) => [
            ...previous,
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: response.content,
              createdAt: Date.now(),
              mode,
              sources: (response.sources ?? []) as AIMessageModel['sources'],
              fromKnowledgeBase: response.fromKnowledgeBase,
            },
          ]);
        }
        if (payload.contextWithheld === true) {
          setMessages((previous) => [
            ...previous,
            {
              id: `notice-${Date.now()}`,
              role: 'assistant',
              content: '_Notice: the context you attached was not sent — the provider is external and the consent for sharing context is off. The answer below is based on the question and the bundled material._',
              createdAt: Date.now(),
              mode,
            },
          ]);
        }
        if (Array.isArray(payload.suggestions)) {
          setSuggestions(payload.suggestions as Array<{ id: string; text: string }>);
        }
        void aiApi.getConversations();
        break;
      }
      case 'AI_ERROR': {
        setBusy(false);
        setRequestId(undefined);
        const text = String(payload.message ?? 'The request failed.');
        setMessages((previous) => [
          ...previous,
          {
            id: `assistant-error-${Date.now()}`,
            role: 'assistant',
            content: `**The assistant could not answer.** ${text}`,
            createdAt: Date.now(),
            mode,
            error: true,
          },
        ]);
        break;
      }
      case 'AI_CONVERSATIONS': {
        setConversations((payload.conversations as typeof conversations) ?? []);
        break;
      }
      case 'AI_CONVERSATION_LOADED': {
        const loaded = payload as unknown as AIConversation;
        setConversation(loaded);
        setMessages(loaded.messages ?? []);
        if (loaded.mode) {
          setMode(loaded.mode);
        }
        break;
      }
      default:
        break;
      }
    },
    [mode]
  );

  useAIMessages(handleMessages);

  /**
   * An editor command (Explain Selected Code, Find Potential Bugs, …) hands
   * the selection over. The code becomes an explicit context item — the
   * student can still remove it before sending.
   */
  useEffect(() => {
    if (!editorRequest || !editorRequest.code) {
      return;
    }

    const { action, code, fileName } = editorRequest;

    setContextDraft({
      items: [
        {
          id: 'context-code',
          kind: 'code',
          label: `Selected code — ${fileName || 'selection'}`,
          content: code,
          source: 'User selection',
        },
      ],
      selection: { code, codeFileName: fileName },
    });

    setDraft(
      action === 'pseudocode'
        ? 'Generate the pseudocode of the selected code.'
        : action === 'bugs'
          ? 'Find the potential logical mistakes in the selected code.'
          : action === 'improve'
            ? 'Suggest improvements for the selected code.'
            : action === 'complexity'
              ? 'Explain the time and space complexity of the selected code.'
              : action === 'document'
                ? 'Write the documentation of the selected code.'
                : action === 'function'
                  ? 'Explain what the selected function does and how it is called.'
                  : 'Explain the selected code.'
    );

    onEditorRequestHandled?.();
  }, [editorRequest, onEditorRequestHandled]);

  useEffect(() => {
    aiApi.getStatus();
    aiApi.getConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, busy]);

  const send = (question: string, task?: string, extraSelection?: ContextSelection): void => {
    const trimmed = question.trim();
    if (!trimmed || busy) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      { id: `user-${Date.now()}`, role: 'user', content: trimmed, createdAt: Date.now(), mode },
    ]);
    setDraft('');
    setSuggestions([]);

    const selection: ContextSelection = { ...contextDraft.selection, ...extraSelection };

    aiApi.ask({
      question: trimmed,
      mode,
      task,
      conversationId: conversation?.id,
      requestId: `req-${Date.now()}`,
      selection,
      includeProgress,
    });
  };

  const handleNewChat = () => {
    aiApi.newConversation(mode);
    setMessages([]);
    setSuggestions([]);
    setConversation(undefined);
  };

  const handleStop = () => {
    if (requestId) {
      aiApi.cancel(requestId);
    }
  };

  const providerConfigured =
    config !== null &&
    (statuses.find((status) => status.id === config.provider)?.requiresKey === false ||
      statuses.find((status) => status.id === config.provider)?.hasKey === true);

  return (
    <Box style={{ padding: SPACING.lg }}>
      <Flex justify="between" align="center" style={{ marginBottom: SPACING.lg }}>
        <Flex align="center" gap={SPACING.md}>
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <Box>
            <Text as="h1" style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: 0, fontSize: '1.6rem' } as React.CSSProperties}>
              DAA Learning Assistant
            </Text>
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 } as React.CSSProperties}>
              Your personal algorithms tutor — grounded in the verified material of the extension.
            </Text>
          </Box>
        </Flex>
        <Button variant="secondary" size="sm" onClick={() => setShowSettings((value) => !value)}>
          Settings
        </Button>
      </Flex>

      {showSettings && (
        <AIProviderSettings
          statuses={statuses}
          config={config}
          testResult={testResult}
          onSaveConfig={(changes) => aiApi.saveConfig(changes)}
          onSaveKey={(provider, key) => aiApi.saveKey(provider, key)}
          onClearKey={(provider) => aiApi.clearKey(provider)}
          onTest={() => {
            setTestResult(null);
            aiApi.test();
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {issues.length > 0 && (
        <Box
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${COLORS.warning}`,
            borderRadius: RADIUS.md,
            padding: SPACING.sm,
            marginBottom: SPACING.md,
          } as React.CSSProperties}
        >
          {issues.map((issue, i) => (
            <Text key={i} as="p" style={{ ...TYPOGRAPHY.small, fontSize: '0.8rem', color: COLORS.warning, margin: 0 } as React.CSSProperties}>
              {issue.message}
            </Text>
          ))}
        </Box>
      )}

      <Flex gap={SPACING.lg} align="start">
        {/* Sidebar */}
        <Box style={{ width: 220, flexShrink: 0 }}>
          <AIConversationList
            conversations={conversations}
            activeId={conversation?.id}
            onNew={handleNewChat}
            onOpen={(id) => aiApi.openConversation(id)}
            onDelete={(id) => aiApi.deleteConversation(id)}
            onClear={() => aiApi.clearConversations()}
          />
        </Box>

        {/* Chat area */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <AIModeSelector mode={mode} onChange={(value) => { setMode(value); if (conversation) { aiApi.setMode(conversation.id, value); } }} />

          {messages.length === 0 && !busy && (
            <Box
              style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.lg,
                padding: SPACING.lg,
                marginBottom: SPACING.md,
              } as React.CSSProperties}
            >
              <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: `0 0 ${SPACING.xs} 0`, fontSize: '1.2rem' } as React.CSSProperties}>
                Welcome! What would you like to understand today?
              </Text>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: `0 0 ${SPACING.md} 0` } as React.CSSProperties}>
                {providerConfigured
                  ? 'Ask anything about the course — the assistant uses the verified algorithm registry of the extension.'
                  : 'No AI provider is configured — the local knowledge base answers from the bundled material. Configure a provider in the settings for free-form explanations.'}
              </Text>
              <AIQuickActions onPick={(task, text) => send(text, task)} />
            </Box>
          )}

          <Box>
            {messages.map((message) => (
              <AIMessageView key={message.id} message={message} />
            ))}
            {busy && (
              <Flex align="center" gap={SPACING.sm} style={{ marginBottom: SPACING.md, paddingLeft: 40 }}>
                <Text as="span" style={{ color: COLORS.accent }} className="daa-ai-typing">
                  ●
                </Text>
                <Text as="span" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted } as React.CSSProperties}>
                  Thinking…
                </Text>
              </Flex>
            )}
            {messages.length > 0 && suggestions.length > 0 && !busy && (
              <AISuggestionChips suggestions={suggestions} onPick={(text) => send(text)} />
            )}
            <div ref={bottomRef} />
          </Box>
        </Box>
      </Flex>

      {/* Input area */}
      <Box
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: COLORS.background,
          borderTop: `1px solid ${COLORS.border}`,
          marginTop: SPACING.md,
        } as React.CSSProperties}
      >
        <AIContextPanel
          items={contextDraft.items}
          withheld={Boolean(
            config &&
            statuses.find((status) => status.id === config.provider)?.isExternal &&
            !config.allowExternalContext &&
            contextDraft.items.some((item) => item.kind !== 'documentation')
          )}
          onRemove={(id) =>
            setContextDraft((previous) => ({
              items: previous.items.filter((item) => item.id !== id),
              selection: {},
            }))
          }
        />
        <Flex gap={SPACING.sm} align="end" style={{ padding: SPACING.md }}>
          <Box style={{ flex: 1 }}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send(draft);
                }
              }}
              placeholder="Ask anything about DAA… (Enter to send, Shift+Enter for a new line)"
              rows={2}
              style={{
                width: '100%',
                backgroundColor: COLORS.surface,
                color: COLORS.textPrimary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.md,
                padding: SPACING.sm,
                fontSize: '0.9rem',
                fontFamily: FONT_FAMILY,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <label style={{ ...TYPOGRAPHY.small, fontSize: '0.75rem', color: COLORS.textMuted, display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: SPACING.xs, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeProgress}
                onChange={(event) => setIncludeProgress(event.target.checked)}
              />
              Attach a summary of my learning progress
            </label>
          </Box>
          {busy ? (
            <Button variant="danger" size="md" onClick={handleStop}>
              Stop
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={() => send(draft)} disabled={!draft.trim()}>
              Send
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
