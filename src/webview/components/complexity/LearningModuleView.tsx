import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Box, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import { NOTATION_EXPLANATIONS, SPACE_COMPLEXITY_TOPICS, TIME_COMPLEXITY_TOPICS } from '../../../core/complexity/learning/ComplexityTopics';
import type { ComplexityTopic } from '../../../core/complexity/learning/ComplexityTopics';

interface LearningModuleViewProps {
  initialTopicId?: string;
}

/**
 * Interactive time & space complexity learning module with reviewed C
 * examples. Renders as an expandable topic list plus a notation reference.
 */
export const LearningModuleView: FunctionComponent<LearningModuleViewProps> = ({ initialTopicId }) => {
  const [openTopic, setOpenTopic] = useState<string | null | undefined>(initialTopicId);

  const toggle = (id: string): void => {
    setOpenTopic((prev) => (prev === id ? null : id));
  };

  return (
    <Box>
      <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.25rem 0' }}>
        Time Complexity — Learn to Derive It
      </Text>
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 1rem 0' }}>
        Twelve reviewed topics from the frequency count method to best/average/worst cases. Expand a topic, work through
        the C example and verify the counts in the analyzer tabs.
      </Text>

      {TIME_COMPLEXITY_TOPICS.map((topic) => (
        <TopicCard key={topic.id} topic={topic} isOpen={openTopic === topic.id} onToggle={() => toggle(topic.id)} />
      ))}

      <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: `${SPACING.xl} 0 0.25rem 0` }}>
        Space Complexity — Aux, Stack and Heap
      </Text>
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 1rem 0' }}>
        Auxiliary space, recursion stack, dynamic allocation, in-place algorithms, and where estimates end and
        measurement begins.
      </Text>

      {SPACE_COMPLEXITY_TOPICS.map((topic) => (
        <TopicCard key={topic.id} topic={topic} isOpen={openTopic === topic.id} onToggle={() => toggle(topic.id)} />
      ))}

      <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: `${SPACING.xl} 0 0.5rem 0` }}>
        Notation Reference
      </Text>
      <Box
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.lg,
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              {['Class', 'Meaning', 'Typical example'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: `${SPACING.sm} ${SPACING.md}`, color: COLORS.textMuted, fontWeight: 500, borderBottom: `1px solid ${COLORS.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NOTATION_EXPLANATIONS.map((row) => (
              <tr key={row.notation}>
                <td style={{ padding: `${SPACING.sm} ${SPACING.md}`, fontFamily: '"SF Mono", Menlo, monospace', color: COLORS.accent, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {row.notation}
                </td>
                <td style={{ padding: `${SPACING.sm} ${SPACING.md}`, color: COLORS.textSecondary, lineHeight: 1.5 }}>
                  {row.meaning}
                </td>
                <td style={{ padding: `${SPACING.sm} ${SPACING.md}`, color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>
                  {row.example}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  );
};

const TopicCard: FunctionComponent<{ topic: ComplexityTopic; isOpen: boolean; onToggle: () => void }> = ({
  topic,
  isOpen,
  onToggle,
}) => (
  <Box
    style={{
      backgroundColor: COLORS.surface,
      border: `1px solid ${isOpen ? COLORS.accent : COLORS.border}`,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.sm,
    }}
  >
    <button
      onClick={onToggle}
      aria-expanded={isOpen}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: SPACING.md,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: `${SPACING.sm} ${SPACING.md}`,
        textAlign: 'left',
        color: COLORS.textPrimary,
      }}
    >
      <Text as="p" style={{ ...TYPOGRAPHY.body, margin: 0, fontWeight: 600 }}>
        {topic.title}
      </Text>
      <span style={{ color: COLORS.textMuted }}>{isOpen ? '−' : '+'}</span>
    </button>

    {isOpen && (
      <Box style={{ padding: `0 ${SPACING.md} ${SPACING.md} ${SPACING.md}` }}>
        <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>
          {topic.summary}
        </Text>

        {topic.example && (
          <Box style={{ marginTop: SPACING.md }}>
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.accent, margin: '0 0 0.35rem 0', fontWeight: 600 }}>
              {topic.example.title}
            </Text>
            <Box
              style={{
                backgroundColor: '#0f172a',
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                fontFamily: '"SF Mono", Menlo, monospace',
                fontSize: '0.82rem',
                lineHeight: 1.6,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                color: COLORS.textPrimary,
              }}
            >
              {topic.example.code}
            </Box>
            <Box style={{ marginTop: SPACING.sm }}>
              {topic.example.analysis.map((line, i) => (
                <Text key={i} as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0.3rem 0', lineHeight: 1.55, paddingLeft: '1rem', textIndent: '-0.85rem' }}>
                  {i + 1}. {line}
                </Text>
              ))}
            </Box>
            <Box
              style={{
                backgroundColor: COLORS.accent + '20',
                borderLeft: `3px solid ${COLORS.accent}`,
                borderRadius: RADIUS.sm,
                padding: `${SPACING.sm} ${SPACING.md}`,
                marginTop: SPACING.sm,
              }}
            >
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
                Result: {topic.example.result}
              </Text>
            </Box>
          </Box>
        )}

        <Box style={{ marginTop: SPACING.md }}>
          {topic.keyPoints.map((point, i) => (
            <Text key={i} as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0.3rem 0', lineHeight: 1.55 }}>
              • {point}
            </Text>
          ))}
        </Box>
      </Box>
    )}
  </Box>
);
