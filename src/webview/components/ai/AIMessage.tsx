import type { FunctionComponent } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { AIMessage as AIMessageModel } from '../../../core/ai/types';
import { AIMarkdown } from './AIMarkdown';

/**
 * One message of the conversation.
 * Assistant answers show their sources and the knowledge-base badge, so the
 * student always sees where an answer came from.
 */
export const AIMessageView: FunctionComponent<{
  message: AIMessageModel;
  onSuggest?: (text: string) => void;
}> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <Flex
      direction="row"
      justify={isUser ? 'flex-end' : 'flex-start'}
      align="start"
      gap={SPACING.sm}
      style={{ marginBottom: SPACING.md }}
    >
      {!isUser && (
        <Box
          style={{
            width: 28,
            height: 28,
            flexShrink: 0,
            borderRadius: RADIUS.md,
            backgroundColor: COLORS.accent,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 700,
          } as React.CSSProperties}
          title="DAA Learning Assistant"
        >
          AI
        </Box>
      )}

      <Box
        style={{
          maxWidth: '85%',
          backgroundColor: isUser ? COLORS.accent : COLORS.surface,
          border: `1px solid ${isUser ? COLORS.accent : COLORS.border}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
        } as React.CSSProperties}
      >
        {isUser ? (
          <Text
            as="p"
            style={{ margin: 0, color: '#ffffff', lineHeight: 1.6, whiteSpace: 'pre-wrap' } as React.CSSProperties}
          >
            {message.content}
          </Text>
        ) : (
          <AIMarkdown content={message.content} />
        )}

        {!isUser && message.fromKnowledgeBase && (
          <Flex align="center" gap={SPACING.xs} style={{ marginTop: SPACING.sm }}>
            <Text
              as="span"
              style={{
                ...TYPOGRAPHY.small,
                fontSize: '0.7rem',
                color: COLORS.success,
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                borderRadius: RADIUS.sm,
                padding: '0.1rem 0.4rem',
              } as React.CSSProperties}
            >
              Local knowledge base
            </Text>
            {message.error && (
              <Text
                as="span"
                style={{
                  ...TYPOGRAPHY.small,
                  fontSize: '0.7rem',
                  color: COLORS.error,
                } as React.CSSProperties}
              >
                failed
              </Text>
            )}
          </Flex>
        )}

        {!isUser && message.sources && message.sources.length > 0 && (
          <Box style={{ marginTop: SPACING.sm, borderTop: `1px solid ${COLORS.border}`, paddingTop: SPACING.sm }}>
            <Text
              as="span"
              style={{ ...TYPOGRAPHY.small, fontSize: '0.75rem', color: COLORS.textMuted } as React.CSSProperties}
            >
              Sources:
            </Text>
            <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1rem' }}>
              {message.sources.map((source, i) => (
                <li key={i} style={{ ...TYPOGRAPHY.small, fontSize: '0.75rem', color: COLORS.textMuted }}>
                  {source.title}
                  <em style={{ opacity: 0.7 }}> — {source.origin}</em>
                </li>
              ))}
            </ul>
          </Box>
        )}

        {!isUser && !message.error && (
          <Flex gap={SPACING.sm} style={{ marginTop: SPACING.sm }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void navigator.clipboard?.writeText(message.content)}
            >
              Copy
            </Button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};

/** The suggested follow-up questions under an answer. */
export const AISuggestionChips: FunctionComponent<{
  suggestions: Array<{ id: string; text: string }>;
  onPick: (text: string) => void;
}> = ({ suggestions, onPick }) => {
  if (suggestions.length === 0) {
    return null;
  }
  return (
    <Flex wrap="wrap" gap={SPACING.xs} style={{ marginBottom: SPACING.md, paddingLeft: 40 }}>
      {suggestions.slice(0, 6).map((suggestion) => (
        <Box
          key={suggestion.id}
          onClick={() => onPick(suggestion.text)}
          style={{
            cursor: 'pointer',
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.xl,
            padding: '0.3rem 0.75rem',
            color: COLORS.textSecondary,
            fontSize: '0.8rem',
          } as React.CSSProperties}
        >
          {suggestion.text}
        </Box>
      ))}
    </Flex>
  );
};

/** The conversation history in the sidebar. */
export const AIConversationList: FunctionComponent<{
  conversations: Array<{ id: string; title: string; messageCount: number; updatedAt: number }>;
  activeId?: string;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClear: () => void;
}> = ({ conversations, activeId, onOpen, onDelete, onNew, onClear }) => (
  <Box style={{ marginBottom: SPACING.md }}>
    <Flex justify="between" align="center" style={{ marginBottom: SPACING.xs }}>
      <Text
        as="span"
        style={{ ...TYPOGRAPHY.small, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' } as React.CSSProperties}
      >
        Conversations
      </Text>
      <Flex gap={SPACING.xs}>
        <Button variant="primary" size="sm" onClick={onNew}>
          New chat
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={conversations.length === 0}>
          Clear
        </Button>
      </Flex>
    </Flex>

    <Box>
      {conversations.map((conversation) => (
        <Flex
          key={conversation.id}
          align="center"
          justify="between"
          onClick={() => onOpen(conversation.id)}
          style={{
            cursor: 'pointer',
            padding: SPACING.xs,
            borderRadius: RADIUS.sm,
            backgroundColor: conversation.id === activeId ? COLORS.surfaceElevated : 'transparent',
            border: `1px solid ${conversation.id === activeId ? COLORS.border : 'transparent'}`,
            marginBottom: '0.15rem',
          } as React.CSSProperties}
        >
          <Text
            as="span"
            style={{
              ...TYPOGRAPHY.small,
              fontSize: '0.8rem',
              color: conversation.id === activeId ? COLORS.textPrimary : COLORS.textSecondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            } as React.CSSProperties}
          >
            {conversation.title}
          </Text>
          <button
            type="button"
            title="Delete conversation"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(conversation.id);
            }}
            style={{
              cursor: 'pointer',
              color: COLORS.textMuted,
              flexShrink: 0,
              padding: '0 0.3rem',
              background: 'transparent',
              border: 'none',
              fontSize: '0.75rem',
            }}
          >
            ✕
          </button>
        </Flex>
      ))}
      {conversations.length === 0 && (
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, fontSize: '0.8rem', margin: 0 }}>
          No conversations yet.
        </Text>
      )}
    </Box>
  </Box>
);

/** Shows which context items are attached — the student can remove each one. */
export const AIContextPanel: FunctionComponent<{
  items: Array<{ id: string; label: string; kind: string; source?: string }>;
  onRemove: (id: string) => void;
  withheld?: boolean;
}> = ({ items, onRemove, withheld }) => {
  if (items.length === 0) {
    return null;
  }
  return (
    <Box
      style={{
        borderTop: `1px solid ${COLORS.border}`,
        padding: SPACING.sm,
        backgroundColor: COLORS.surface,
      } as React.CSSProperties}
    >
      <Flex align="center" gap={SPACING.xs} wrap="wrap">
        <Text
          as="span"
          style={{ ...TYPOGRAPHY.small, fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' } as React.CSSProperties}
        >
          Context:
        </Text>
        {items.map((item) => (
          <Flex
            key={item.id}
            align="center"
            gap={SPACING.xs}
            style={{
              backgroundColor: COLORS.surfaceElevated,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.xl,
              padding: '0.15rem 0.5rem',
            } as React.CSSProperties}
          >
            <Text as="span" style={{ fontSize: '0.75rem', color: COLORS.textSecondary }}>
              {item.label}
            </Text>
            <Box
              onClick={() => onRemove(item.id)}
              style={{ cursor: 'pointer', color: COLORS.textMuted, fontSize: '0.7rem' } as React.CSSProperties}
              title={`Remove — ${item.source ?? item.kind}`}
            >
              ✕
            </Box>
          </Flex>
        ))}
        {withheld && (
          <Text as="span" style={{ ...TYPOGRAPHY.small, fontSize: '0.7rem', color: COLORS.warning } as React.CSSProperties}>
            (not sent — external provider without consent)
          </Text>
        )}
      </Flex>
    </Box>
  );
};
