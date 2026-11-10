import type { FunctionComponent } from 'react';
import { Box, Flex, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import { DEFAULT_SERIES_COLORS, GrowthChart } from './GrowthChart';

interface MeasuredOperationsChartProps {
  /** One series per algorithm: operation counts measured at each input size. */
  series: Array<{ name: string; counts: number[] }>;
  sizes: number[];
  /** Which counter is plotted (used in labels). */
  counterName?: string;
  logScaleDefault?: boolean;
}

/**
 * Overlays real instrumented operation counts for one or more algorithms
 * across input sizes. Uses the growth chart renderer with measured data.
 */
export const MeasuredOperationsChart: FunctionComponent<MeasuredOperationsChartProps> = ({
  series,
  sizes,
  counterName = 'comparisons',
  logScaleDefault = true,
}) => {
  if (series.length === 0 || sizes.length === 0) {
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
          No measured data yet. Run operation counts at two or more input size presets to overlay the growth of real
          counted operations on this chart.
        </Text>
      </Box>
    );
  }

  const growthSeries = series.map((s, i) => ({
    name: s.name,
    color: DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length],
    values: s.counts.map((c) => Math.max(1, c)),
  }));

  return (
    <Box>
      <Flex gap={SPACING.md} style={{ flexWrap: 'wrap', marginBottom: SPACING.md } as React.CSSProperties}>
        {growthSeries.map((s) => (
          <Flex key={s.name} gap="6px" align="center">
            <Box style={{ width: 14, height: 3.2, backgroundColor: s.color, borderRadius: 2 }} />
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0 }}>
              {s.name}
            </Text>
          </Flex>
        ))}
      </Flex>
      <GrowthChart
        series={growthSeries}
        sampleSizes={sizes}
        logScale={logScaleDefault}
        title={undefined}
        explanation={`Each point is the actual ${counterName} counter value recorded by the instrumented engine for that algorithm and input size. With the logarithmic scale on, a straight line means the count grows as a power of n^k (straight slope = polynomial exponent).`}
      />
    </Box>
  );
};
