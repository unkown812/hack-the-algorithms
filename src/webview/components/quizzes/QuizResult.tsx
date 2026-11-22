import type { FunctionComponent } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { QuizResult } from '../../../core/practice/types';

interface QuizResultProps {
  result: QuizResult;
  onRestart: () => void;
  onBack: () => void;
}

/**
 * The result of a finished quiz: the score, the breakdown per topic and the
 * explanation of every question.
 */
export const QuizResultView: FunctionComponent<QuizResultProps> = ({ result, onRestart, onBack }) => {
  const percentage = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;
  const tone = percentage >= 70 ? COLORS.success : percentage >= 40 ? COLORS.warning : COLORS.error;

  return (
    <Box style={{ display: 'grid', gap: SPACING.lg }}>
      <Box
        style={{
          padding: SPACING.lg,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.surface,
        }}
      >
        <Flex gap={SPACING.lg} align="center" style={{ flexWrap: 'wrap' } as React.CSSProperties}>
          <Box>
            <div style={{ fontSize: '2.25rem', fontWeight: 700, color: tone }}>
              {result.score} / {result.maxScore}
            </div>
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
              {result.accuracy} % accuracy · {result.durationSeconds} s
            </Text>
          </Box>
          <Box style={{ flex: 1, minWidth: 220 }}>
            <Flex gap={SPACING.md} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
              <Stat label="Correct" value={result.correctCount} color={COLORS.success} />
              <Stat label="Incorrect" value={result.incorrectCount} color={COLORS.error} />
              <Stat label="Unanswered" value={result.unansweredCount} color={COLORS.textMuted} />
            </Flex>
          </Box>
          <Flex gap={SPACING.sm}>
            <Button variant="secondary" onClick={onRestart}>
              Try again
            </Button>
            <Button variant="ghost" onClick={onBack}>
              Back to the practice centre
            </Button>
          </Flex>
        </Flex>
      </Box>

      {result.recommendedRevision.length > 0 && (
        <Box
          style={{
            padding: SPACING.md,
            borderRadius: RADIUS.md,
            border: `1px solid ${COLORS.warning}`,
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
          }}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: '0 0 0.35rem 0', fontWeight: 600 }}>
            Recommended revision
          </Text>
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0 }}>
            {result.recommendedRevision.join(' · ')}
          </Text>
        </Box>
      )}

      <Box style={{ display: 'grid', gap: SPACING.sm }}>
        {result.questions.map((entry, index) => (
          <Box
            key={entry.question.id}
            style={{
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              border: `1px solid ${COLORS.border}`,
              borderLeft: `3px solid ${entry.correct ? COLORS.success : COLORS.error}`,
              backgroundColor: COLORS.surface,
            }}
          >
            <Flex gap={SPACING.sm} align="center" style={{ marginBottom: SPACING.xs } as React.CSSProperties}>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
                {index + 1}.
              </Text>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
                {entry.question.title}
              </Text>
              <span style={{ flex: 1 }} />
              <Text
                as="p"
                style={{
                  ...TYPOGRAPHY.small,
                  color: entry.correct ? COLORS.success : COLORS.error,
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {entry.correct ? 'Correct' : 'Incorrect'}
              </Text>
            </Flex>
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0 }}>
              {entry.question.explanation}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const Stat: FunctionComponent<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <Box
    style={{
      padding: `${SPACING.xs} ${SPACING.md}`,
      borderRadius: RADIUS.sm,
      backgroundColor: COLORS.surfaceElevated,
      minWidth: 92,
    }}
  >
    <div style={{ fontSize: '1.25rem', fontWeight: 700, color }}>{value}</div>
    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
      {label}
    </Text>
  </Box>
);
