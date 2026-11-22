import type { FunctionComponent } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { AIQuestionDraft } from '../../../core/ai/types';

/**
 * The review workflow of the generated questions.
 *
 * A generated question is not part of the verified question bank. The student
 * reads it, checks the answer and the explanation, and decides whether it
 * may be used in a quiz. Only an approved question enters the practice
 * centre — and even then it stays marked as AI-generated and reviewed.
 */
export const AIQuestionReview: FunctionComponent<{
  drafts: AIQuestionDraft[];
  onApprove: (draftId: string) => void;
  onReject: (draftId: string) => void;
  onDelete: (draftId: string) => void;
  onClearRejected: () => void;
  onClose: () => void;
  /** The problems the validation found for the last generation. */
  rejected?: Array<{ title: string; issues: string[] }>;
}> = ({ drafts, onApprove, onReject, onDelete, onClearRejected, onClose, rejected }) => {
  const pending = drafts.filter((draft) => draft.status === 'pending');
  const approved = drafts.filter((draft) => draft.status === 'approved');
  const rejectedDrafts = drafts.filter((draft) => draft.status === 'rejected');

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
      } as React.CSSProperties}
    >
      <Flex justify="between" align="center" style={{ marginBottom: SPACING.md }}>
        <Box>
          <Text as="h3" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: 0, fontSize: '1rem' } as React.CSSProperties}>
            Generated questions — review
          </Text>
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0, fontSize: '0.8rem' } as React.CSSProperties}>
            {pending.length} waiting · {approved.length} approved · {rejectedDrafts.length} rejected
          </Text>
        </Box>
        <Flex gap={SPACING.xs}>
          {rejectedDrafts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearRejected}>
              Clear rejected
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </Flex>
      </Flex>

      {rejected && rejected.length > 0 && (
        <Box
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${COLORS.error}`,
            borderRadius: RADIUS.md,
            padding: SPACING.sm,
            marginBottom: SPACING.md,
          } as React.CSSProperties}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, fontSize: '0.8rem', color: COLORS.error, margin: `0 0 ${SPACING.xs} 0` } as React.CSSProperties}>
            {rejected.length} generated question(s) were discarded because they did not pass the validation:
          </Text>
          {rejected.map((entry, index) => (
            <Text key={index} as="p" style={{ ...TYPOGRAPHY.small, fontSize: '0.78rem', color: COLORS.textSecondary, margin: 0 } as React.CSSProperties}>
              • {entry.title} — {entry.issues.join(' ')}
            </Text>
          ))}
        </Box>
      )}

      {drafts.length === 0 && (
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 } as React.CSSProperties}>
          No generated questions yet. Ask the assistant to generate practice questions and they will appear here for review.
        </Text>
      )}

      {drafts.map((draft) => (
        <Box
          key={draft.id}
          style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            marginBottom: SPACING.sm,
            backgroundColor: COLORS.background,
          } as React.CSSProperties}
        >
          <Flex justify="between" align="start" gap={SPACING.sm}>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Flex align="center" gap={SPACING.xs} wrap="wrap">
                <Text as="span" style={{ ...TYPOGRAPHY.small, fontWeight: 700, color: COLORS.textPrimary, fontSize: '0.85rem' } as React.CSSProperties}>
                  {draft.title}
                </Text>
                <Text as="span" style={{ ...TYPOGRAPHY.small, fontSize: '0.7rem', color: COLORS.textMuted } as React.CSSProperties}>
                  {draft.type} · {draft.difficulty} · {draft.topic}
                </Text>
                <Text
                  as="span"
                  style={{
                    ...TYPOGRAPHY.small,
                    fontSize: '0.7rem',
                    color:
                      draft.status === 'approved'
                        ? COLORS.success
                        : draft.status === 'rejected'
                          ? COLORS.error
                          : COLORS.warning,
                  } as React.CSSProperties}
                >
                  {draft.status}
                </Text>
              </Flex>

              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: `${SPACING.xs} 0 0 0`, fontSize: '0.83rem' } as React.CSSProperties}>
                {draft.question}
              </Text>

              {draft.options && draft.options.length > 0 && (
                <ul style={{ margin: `${SPACING.xs} 0 0 0`, paddingLeft: '1.1rem' }}>
                  {draft.options.map((option) => {
                    const answers = Array.isArray(draft.correctAnswer)
                      ? draft.correctAnswer
                      : [draft.correctAnswer];
                    const isCorrect = answers.includes(option);
                    return (
                      <li
                        key={option}
                        style={{
                          ...TYPOGRAPHY.small,
                          fontSize: '0.8rem',
                          color: isCorrect ? COLORS.success : COLORS.textMuted,
                        }}
                      >
                        {option}
                        {isCorrect ? ' ✓' : ''}
                      </li>
                    );
                  })}
                </ul>
              )}

              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: `${SPACING.xs} 0 0 0`, fontSize: '0.78rem' } as React.CSSProperties}>
                <strong style={{ color: COLORS.textSecondary }}>Answer:</strong>{' '}
                {Array.isArray(draft.correctAnswer) ? draft.correctAnswer.join(', ') : draft.correctAnswer}
              </Text>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: `${SPACING.xs} 0 0 0`, fontSize: '0.78rem' } as React.CSSProperties}>
                <strong style={{ color: COLORS.textSecondary }}>Why:</strong> {draft.explanation}
              </Text>

              {draft.issues.length > 0 && (
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.warning, margin: `${SPACING.xs} 0 0 0`, fontSize: '0.75rem' } as React.CSSProperties}>
                  {draft.issues.join(' ')}
                </Text>
              )}
            </Box>

            <Flex direction="column" gap={SPACING.xs} style={{ flexShrink: 0 }}>
              {draft.status === 'pending' && (
                <>
                  <Button variant="primary" size="sm" onClick={() => onApprove(draft.id)}>
                    Approve
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => onReject(draft.id)}>
                    Reject
                  </Button>
                </>
              )}
              {draft.status === 'approved' && (
                <Text as="span" style={{ ...TYPOGRAPHY.small, fontSize: '0.7rem', color: COLORS.success } as React.CSSProperties}>
                  usable in quizzes
                </Text>
              )}
              {draft.status === 'rejected' && draft.reviewNote && (
                <Text as="span" style={{ ...TYPOGRAPHY.small, fontSize: '0.7rem', color: COLORS.textMuted } as React.CSSProperties}>
                  {draft.reviewNote}
                </Text>
              )}
              <Button variant="ghost" size="sm" onClick={() => onDelete(draft.id)}>
                Delete
              </Button>
            </Flex>
          </Flex>
        </Box>
      ))}
    </Box>
  );
};
