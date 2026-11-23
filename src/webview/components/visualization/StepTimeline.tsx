import type { FunctionComponent } from 'react';
import { Box, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, STATUS_COLORS } from '../Theme';

/** Maximum number of steps rendered in the timeline; larger traces are windowed. */
const TIMELINE_WINDOW = 30;

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
  const safeStepIndex = Math.max(0, Math.min(stepIndex, Math.max(0, totalSteps - 1)));
  const startIndex = Math.max(0, Math.min(safeStepIndex - Math.floor((TIMELINE_WINDOW - 1) / 2), Math.max(0, totalSteps - TIMELINE_WINDOW)));
  const endIndex = Math.min(totalSteps, startIndex + TIMELINE_WINDOW);
  const visibleSteps = Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i);
  const isWindowed = totalSteps > TIMELINE_WINDOW;

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
        {isWindowed && (
          <Text
            as="p"
            style={{
              ...TYPOGRAPHY.small,
              color: COLORS.textMuted,
              margin: `0 0 ${SPACING.sm} 0`,
            } as React.CSSProperties}
          >
            Showing steps {startIndex + 1}–{endIndex} of {totalSteps}.
          </Text>
        )}
        {visibleSteps.map((i) => {
          const isCurrent = i === safeStepIndex;
          const isCompleted = i < safeStepIndex;
          return (
            <Box
              key={i}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: RADIUS.md,
                backgroundColor: isCurrent
                  ? STATUS_COLORS.accent + '20'
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
