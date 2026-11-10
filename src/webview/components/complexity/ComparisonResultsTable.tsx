import type { FunctionComponent } from 'react';
import { Box, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { ComparisonResult } from '../../../core/complexity/types/ComparisonResult';

interface ComparisonResultsTableProps {
  result: ComparisonResult;
  primaryAlgorithmId: string;
}

const METRIC_ROWS: Array<{ key: string; label: string; get: (row: RowData) => string }> = [
  { key: 'best', label: 'Theoretical best case', get: (r) => r.theoreticalBest },
  { key: 'average', label: 'Theoretical average case', get: (r) => r.theoreticalAverage },
  { key: 'worst', label: 'Theoretical worst case', get: (r) => r.theoreticalWorst },
  { key: 'aux', label: 'Auxiliary space', get: (r) => r.auxiliarySpace },
  { key: 'comparisons', label: 'Comparisons (instrumented)', get: (r) => r.operationMetrics.comparisons.toLocaleString() },
  { key: 'swaps', label: 'Swaps (instrumented)', get: (r) => r.operationMetrics.swaps.toLocaleString() },
  { key: 'assignments', label: 'Assignments (instrumented)', get: (r) => r.operationMetrics.assignments.toLocaleString() },
  { key: 'writes', label: 'Array writes (instrumented)', get: (r) => r.operationMetrics.arrayWrites.toLocaleString() },
  { key: 'loops', label: 'Loop iterations (instrumented)', get: (r) => r.operationMetrics.loopIterations.toLocaleString() },
  { key: 'total', label: 'Total instrumented operations', get: (r) => r.operationMetrics.totalOperations.toLocaleString() },
  { key: 'time', label: 'Mean execution time (measured)', get: (r) => (r.executionTimeMs !== undefined ? `${r.executionTimeMs.toFixed(3)} ms` : 'not measured') },
];

interface RowData {
  theoreticalBest: string;
  theoreticalAverage: string;
  theoreticalWorst: string;
  auxiliarySpace: string;
  operationMetrics: { comparisons: number; swaps: number; assignments: number; arrayWrites: number; loopIterations: number; totalOperations: number };
  executionTimeMs?: number;
  outputValid?: boolean;
}

export const ComparisonResultsTable: FunctionComponent<ComparisonResultsTableProps> = ({ result, primaryAlgorithmId }) => {
  const rows = result.algorithms.map(
    (entry): RowData & { id: string; name: string; primary: boolean } => ({
      id: entry.algorithmId,
      name: entry.algorithmName,
      primary: entry.algorithmId === primaryAlgorithmId,
      theoreticalBest: entry.theoreticalBest,
      theoreticalAverage: entry.theoreticalAverage,
      theoreticalWorst: entry.theoreticalWorst,
      auxiliarySpace: entry.auxiliarySpace,
      operationMetrics: entry.operationMetrics,
      executionTimeMs: entry.executionTimeMs,
      outputValid: entry.outputValid,
    })
  );

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        overflowX: 'auto',
      }}
    >
      <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.25rem 0' }}>
        Comparison Table
      </Text>
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 1rem 0' }}>
        Input size {result.inputSize.toLocaleString()} · scenario “{result.scenario}” · identical dataset for every
        algorithm. Theoretical rows are reviewed metadata; instrumented rows come from real counted runs on that dataset;
        execution time is a measured average of the instrumented TypeScript execution.
      </Text>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', color: COLORS.textMuted, fontWeight: 500, padding: `${SPACING.sm} 0`, borderBottom: `1px solid ${COLORS.border}`, minWidth: 220 }}>
              Metric
            </th>
            {rows.map((row) => (
              <th
                key={row.id}
                style={{
                  textAlign: 'center',
                  padding: `${SPACING.sm} ${SPACING.sm}`,
                  borderBottom: `1px solid ${COLORS.border}`,
                  color: row.primary ? COLORS.accent : COLORS.textPrimary,
                  fontWeight: 600,
                  minWidth: 130,
                }}
              >
                {row.name}
                {row.primary && (
                  <span style={{ marginLeft: 6, fontSize: '0.7rem', color: COLORS.textMuted }}>(selected)</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRIC_ROWS.map((metric) => (
            <tr key={metric.key}>
              <td style={{ color: COLORS.textSecondary, padding: `${SPACING.sm} 0`, borderBottom: `1px solid ${COLORS.border}` }}>
                {metric.label}
              </td>
              {rows.map((row) => (
                <td
                  key={row.id}
                  style={{
                    color: COLORS.textPrimary,
                    textAlign: 'center',
                    padding: `${SPACING.sm} ${SPACING.sm}`,
                    borderBottom: `1px solid ${COLORS.border}`,
                    fontFamily: '"SF Mono", Menlo, monospace',
                  }}
                >
                  {metric.get(row)}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td style={{ color: COLORS.textSecondary, padding: '0.75rem 0 0 0' }}>Output validation</td>
            {rows.map((row) => (
              <td key={row.id} style={{ textAlign: 'center', padding: '0.75rem 0 0 0', color: row.outputValid === false ? COLORS.error : COLORS.success, fontWeight: 600 }}>
                {row.outputValid === false ? 'FAILED' : 'PASSED'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </Box>
  );
};
