import type { FunctionComponent } from 'react';
import { Box, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';

type Props = {
  stepIndex: number;
  totalSteps: number;
  onStepClick: (index: number) => void;
};

export const StepTimeline: FunctionComponent<Props> = ({
  stepIndex,
  totalSteps,
  onStepClick,
}) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        maxHeight: 300,
        overflowY: 'auto',
      } as React.CSSProperties}
    >
      <Text
        as="h3"
        style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 1rem 0' } as React.CSSProperties}
      >
        Step Timeline
      </Text>

      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        } as React.CSSProperties}
      >
        {steps.map((i) => {
          const isCurrent = i === stepIndex;
          const isCompleted = i < stepIndex;
          return (
            <Box
              key={i}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: RADIUS.md,
                backgroundColor: isCurrent
                  ? COLORS.accent + '20'
                  : isCompleted
                    ? COLORS.surfaceElevated
                    : 'transparent',
                border: `1px solid ${isCurrent ? COLORS.accent : 'transparent'}`,
                cursor: 'pointer',
                color: isCurrent ? COLORS.textPrimary : COLORS.textSecondary,
                fontSize: '0.875rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s',
                ':hover': {
                  backgroundColor: COLORS.surfaceElevated,
                },
              } as unknown as React.CSSProperties}
              onClick={() => onStepClick(i)}
            >
              <Text as="span" style={{ fontWeight: isCurrent ? 600 : 400 } as React.CSSProperties}>
                Step {i + 1}
              </Text>
              <Text
                as="span"
                style={{
                  fontSize: '0.75rem',
                  color: isCompleted ? '#22c55e' : COLORS.textMuted,
                } as React.CSSProperties}
              >
                {isCompleted ? '✓' : '○'}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
