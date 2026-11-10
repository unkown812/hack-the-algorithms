import type { FunctionComponent } from 'react';
import { Box, Flex, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';

type Props = {
  counters: {
    operations: number;
    comparisons: number;
    swaps: number;
    iterations: number;
  };
  theoretical?: {
    best: string;
    average: string;
    worst: string;
  };
};

export const ComplexityIndicator: FunctionComponent<Props> = ({
  counters,
  theoretical,
}) => {
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
        Complexity Analysis
      </Text>

      <Flex gap={SPACING.md} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
        <Box
          style={{
            backgroundColor: COLORS.surfaceElevated,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            textAlign: 'center',
            minWidth: 100,
          } as React.CSSProperties}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' } as React.CSSProperties}>
            Operations
          </Text>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600, margin: 0 } as React.CSSProperties}
          >
            {counters.operations}
          </Text>
        </Box>
        <Box
          style={{
            backgroundColor: COLORS.surfaceElevated,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            textAlign: 'center',
            minWidth: 100,
          } as React.CSSProperties}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' } as React.CSSProperties}>
            Comparisons
          </Text>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600, margin: 0 } as React.CSSProperties}
          >
            {counters.comparisons}
          </Text>
        </Box>
        <Box
          style={{
            backgroundColor: COLORS.surfaceElevated,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            textAlign: 'center',
            minWidth: 100,
          } as React.CSSProperties}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' } as React.CSSProperties}>
            Swaps
          </Text>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600, margin: 0 } as React.CSSProperties}
          >
            {counters.swaps}
          </Text>
        </Box>
        <Box
          style={{
            backgroundColor: COLORS.surfaceElevated,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            textAlign: 'center',
            minWidth: 100,
          } as React.CSSProperties}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' } as React.CSSProperties}>
            Iterations
          </Text>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600, margin: 0 } as React.CSSProperties}
          >
            {counters.iterations}
          </Text>
        </Box>
      </Flex>

      {theoretical && (
        <Box style={{ marginTop: SPACING.lg } as React.CSSProperties}>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.5rem 0', fontWeight: 600 } as React.CSSProperties}
          >
            Theoretical Complexity
          </Text>
          <Flex gap={SPACING.md} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
            <Box style={{ flex: 1, minWidth: 100 } as React.CSSProperties}>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.25rem 0' } as React.CSSProperties}>
                Best
              </Text>
              <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}>
                {theoretical.best}
              </Text>
            </Box>
            <Box style={{ flex: 1, minWidth: 100 } as React.CSSProperties}>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.25rem 0' } as React.CSSProperties}>
                Average
              </Text>
              <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}>
                {theoretical.average}
              </Text>
            </Box>
            <Box style={{ flex: 1, minWidth: 100 } as React.CSSProperties}>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.25rem 0' } as React.CSSProperties}>
                Worst
              </Text>
              <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}>
                {theoretical.worst}
              </Text>
            </Box>
          </Flex>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0.5rem 0 0 0' } as React.CSSProperties}
          >
            Observed counts reflect actual algorithm operations, not Big-O notation.
          </Text>
        </Box>
      )}
    </Box>
  );
};
