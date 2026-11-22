import type { FunctionComponent } from 'react';
import { Box, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { ExecutionStep } from '../../../core/visualization/types';

type Props = {
  step: ExecutionStep | undefined;
};

export const ExecutionExplanation: FunctionComponent<Props> = ({ step }) => {
  if (!step) {
    return (
      <Box
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          minHeight: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        } as React.CSSProperties}
      >
        <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted, margin: 0 } as React.CSSProperties}>
          No execution step selected.
        </Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      } as React.CSSProperties}
    >
      <Text
        as="h3"
        style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 1rem 0' } as React.CSSProperties}
      >
        Execution Explanation
      </Text>

      <Box
        style={{
          backgroundColor: '#0f172a',
          borderLeft: `3px solid ${COLORS.accent}`,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
          marginBottom: SPACING.md,
        } as React.CSSProperties}
      >
        <Text
          as="p"
          style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 1.7, margin: 0 } as React.CSSProperties}
        >
          {step.explanation}
        </Text>
      </Box>

      <Box
        style={{
          display: 'flex',
          gap: SPACING.md,
          flexWrap: 'wrap',
        } as React.CSSProperties}
      >
        <Box
          style={{
            backgroundColor: COLORS.surfaceElevated,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            minWidth: 120,
          } as React.CSSProperties}
        >
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' } as React.CSSProperties}
          >
            Operation
          </Text>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600, margin: 0 } as React.CSSProperties}
          >
            {step.operation}
          </Text>
        </Box>
        <Box
          style={{
            backgroundColor: COLORS.surfaceElevated,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            minWidth: 120,
          } as React.CSSProperties}
        >
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' } as React.CSSProperties}
          >
            Step #{step.id}
          </Text>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600, margin: 0 } as React.CSSProperties}
          >
            {step.lineNumber !== null && step.lineNumber !== undefined ? `Line ${step.lineNumber}` : '—'}
          </Text>
        </Box>
      </Box>

      {(step.comparedElements?.length ?? 0) > 0 && (
        <Box style={{ marginTop: SPACING.md } as React.CSSProperties}>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.5rem 0', fontWeight: 600 } as React.CSSProperties}
          >
            Comparing:
          </Text>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}
          >
            {step.comparedElements?.join(', ') ?? '—'}
          </Text>
        </Box>
      )}
      {(step.swappedElements?.length ?? 0) > 0 && (
        <Box style={{ marginTop: SPACING.md } as React.CSSProperties}>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.5rem 0', fontWeight: 600 } as React.CSSProperties}
          >
            Swapping:
          </Text>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}
          >
            {step.swappedElements?.join(', ') ?? '—'}
          </Text>
        </Box>
      )}
    </Box>
  );
};
