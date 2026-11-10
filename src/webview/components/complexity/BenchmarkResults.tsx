import type { FunctionComponent } from 'react';
import { Box, Flex, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { BenchmarkResult } from '../../../core/complexity/types/BenchmarkResult';

interface BenchmarkResultsProps {
  result: BenchmarkResult | null;
  isRunning?: boolean;
}

export const BenchmarkResults: FunctionComponent<BenchmarkResultsProps> = ({
  result,
  isRunning = false,
}) => {
  if (isRunning) {
    return (
      <Box
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          textAlign: 'center',
        }}
      >
        <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted, margin: 0 }}>
          Running benchmark...
        </Text>
      </Box>
    );
  }

  if (!result) {
    return (
      <Box
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          textAlign: 'center',
        }}
      >
        <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted, margin: 0 }}>
          No benchmark results yet. Run a benchmark to see results.
        </Text>
      </Box>
    );
  }

  const stats = [
    { label: 'Minimum', value: result.minimumTimeMs },
    { label: 'Median', value: result.medianTimeMs },
    { label: 'Mean', value: result.meanTimeMs },
    { label: 'Maximum', value: result.maximumTimeMs },
  ];

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      }}
    >
      <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 1rem 0' }}>
        Benchmark Results
      </Text>

      <Flex gap={SPACING.md} style={{ flexWrap: 'wrap', marginBottom: SPACING.md } as React.CSSProperties}>
        <Box style={{ flex: 1, minWidth: 120 }}>
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
            Input Size
          </Text>
          <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
            {result.inputSize}
          </Text>
        </Box>
        <Box style={{ flex: 1, minWidth: 120 }}>
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
            Scenario
          </Text>
          <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
            {result.scenario}
          </Text>
        </Box>
        <Box style={{ flex: 1, minWidth: 120 }}>
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
            Trials
          </Text>
          <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
            {result.trials} (+{result.warmupRuns} warmup)
          </Text>
        </Box>
      </Flex>

      <Flex gap={SPACING.md} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
        {stats.map((stat) => (
          <Box
            key={stat.label}
            style={{
              backgroundColor: COLORS.surfaceElevated,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              textAlign: 'center',
              flex: 1,
              minWidth: 100,
            }}
          >
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' }}>
              {stat.label}
            </Text>
            <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600, margin: 0 }}>
              {stat.value.toFixed(3)} ms
            </Text>
          </Box>
        ))}
      </Flex>

      {result.standardDeviationMs !== undefined && (
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0.5rem 0 0 0' }}>
          Standard Deviation: {result.standardDeviationMs.toFixed(3)} ms
        </Text>
      )}
    </Box>
  );
};
