import type { FunctionComponent } from 'react';
import { Box, Flex, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { TestRunSummary, TestStatus } from '../../../core/playground/types';

interface TestResultsPanelProps {
  summary: TestRunSummary | null;
}

const STATUS_COLORS: Record<TestStatus, string> = {
  passed: COLORS.success,
  failed: COLORS.error,
  'compile-error': COLORS.error,
  'runtime-error': COLORS.error,
  timeout: COLORS.warning,
  cancelled: COLORS.warning,
};

/** Shows the result of the last test run. */
export const TestResultsPanel: FunctionComponent<TestResultsPanelProps> = ({ summary }) => {
  if (!summary) {
    return (
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
        No test run yet. Run the test cases to compare the program output with the expected output.
      </Text>
    );
  }

  return (
    <Box style={{ display: 'grid', gap: SPACING.md }}>
      <Flex gap={SPACING.md} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
        <SummaryTile label="Passed" value={summary.passed} color={COLORS.success} />
        <SummaryTile label="Failed" value={summary.failed} color={COLORS.error} />
        <SummaryTile label="Errors" value={summary.errored} color={COLORS.warning} />
        <SummaryTile label="Total" value={summary.total} color={COLORS.textPrimary} />
        <SummaryTile label="Duration" value={`${summary.durationMs} ms`} color={COLORS.textPrimary} />
      </Flex>

      <Box style={{ display: 'grid', gap: SPACING.sm }}>
        {summary.results.map((result) => (
          <Box
            key={result.testCaseId}
            style={{
              border: `1px solid ${COLORS.border}`,
              borderLeft: `3px solid ${STATUS_COLORS[result.status]}`,
              borderRadius: RADIUS.sm,
              padding: SPACING.sm,
              backgroundColor: COLORS.surfaceElevated,
            }}
          >
            <Flex gap={SPACING.sm} align="center">
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: STATUS_COLORS[result.status], margin: 0, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                {result.status}
              </Text>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
                {result.name}
              </Text>
              <span style={{ flex: 1 }} />
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0, fontSize: '0.72rem' }}>
                {result.durationMs} ms
              </Text>
            </Flex>

            {result.detail && (
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: `${SPACING.xs} 0 0 0` }}>
                {result.detail}
              </Text>
            )}

            {result.diff && result.diff.length > 0 && (
              <Box
                style={{
                  marginTop: SPACING.xs,
                  padding: SPACING.sm,
                  backgroundColor: '#0b1220',
                  borderRadius: RADIUS.sm,
                  fontFamily: '"SF Mono", Menlo, monospace',
                  fontSize: '0.72rem',
                  color: COLORS.textSecondary,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {result.diff.join('\n')}
                <div style={{ marginTop: SPACING.xs, color: COLORS.textMuted }}>
                  expected: {JSON.stringify(result.expectedOutput)}
                </div>
                <div style={{ color: COLORS.textMuted }}>actual: {JSON.stringify(result.actualOutput)}</div>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const SummaryTile: FunctionComponent<{ label: string; value: number | string; color: string }> = ({
  label,
  value,
  color,
}) => (
  <Box
    style={{
      padding: `${SPACING.sm} ${SPACING.md}`,
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
