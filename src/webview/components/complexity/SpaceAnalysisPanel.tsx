import type { FunctionComponent } from 'react';
import { Box, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { SpaceAnalysis } from '../../../core/complexity/types/SpaceMetrics';

interface SpaceAnalysisPanelProps {
  analysis: SpaceAnalysis | null;
}

type Row = { label: string; value: string; kind: 'theoretical' | 'estimated' | 'measured'; hint?: string };

const KIND_STYLES: Record<Row['kind'], { bg: string; color: string; label: string }> = {
  theoretical: { bg: '#3b82f626', color: '#3b82f6', label: 'THEORETICAL' },
  estimated: { bg: '#f59e0b26', color: '#f59e0b', label: 'ESTIMATED' },
  measured: { bg: '#22c55e26', color: '#22c55e', label: 'INSTRUMENTED' },
};

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined) {return '—';}
  if (bytes < 1024) {return `${bytes} B`;}
  if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const SpaceAnalysisPanel: FunctionComponent<SpaceAnalysisPanelProps> = ({ analysis }) => {
  if (!analysis) {
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
          Run an operation-count experiment first — the space panel analyses the allocations recorded during an
          instrumented run.
        </Text>
      </Box>
    );
  }

  const rows: Row[] = [
    {
      label: 'Theoretical auxiliary space',
      value: analysis.theoreticalAuxiliary,
      kind: 'theoretical',
    },
  ];
  if (analysis.theoreticalTotal) {
    rows.push({ label: 'Theoretical total space', value: analysis.theoreticalTotal, kind: 'theoretical' });
  }
  rows.push({
    label: 'Estimated auxiliary bytes (model)',
    value: formatBytes(analysis.estimatedAuxiliaryBytes),
    kind: 'estimated',
    hint: 'Derived from the complexity class and implementation structure, not a measurement.',
  });
  if (analysis.measuredPeakBytes !== undefined) {
    rows.push({
      label: 'Peak auxiliary bytes during the run',
      value: formatBytes(analysis.measuredPeakBytes),
      kind: 'measured',
    });
  }
  if (analysis.measuredAllocations !== undefined) {
    rows.push({
      label: 'Temp-array allocations / releases',
      value: `${analysis.measuredAllocations} / ${analysis.measuredDeallocations ?? 0}`,
      kind: 'measured',
    });
  }
  rows.push({
    label: analysis.measuredRecursionDepth !== undefined && analysis.measuredRecursionDepth > 1 ? 'Recursion depth observed' : 'Recursion depth observed (1 = iterative)',
    value: String(analysis.measuredStackDepth ?? analysis.measuredRecursionDepth ?? 1),
    kind: 'measured',
    hint: 'Every recursive frame stores its locals until it returns; this is the deepest level reached.',
  });

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      }}
    >
      <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.25rem 0' }}>
        Space Analysis
      </Text>
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 1rem 0' }}>
        Input size {analysis.inputSize.toLocaleString()} elements. Theory answers “how does usage grow?”, estimates add
        approximate bytes, and the instrumented run records what actually happened for this input.
      </Text>

      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: SPACING.md }}>
        {rows.map((row) => {
          const kind = KIND_STYLES[row.kind];
          return (
            <Box
              key={row.label}
              style={{
                backgroundColor: COLORS.surfaceElevated,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
              }}
            >
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.5rem 0' }}>
                {row.label}
              </Text>
              <Box
                style={{
                  backgroundColor: kind.bg,
                  color: kind.color,
                  display: 'inline-block',
                  padding: '0.15rem 0.55rem',
                  borderRadius: RADIUS.sm,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  marginBottom: '0.5rem',
                }}
              >
                {kind.label}
              </Box>
              <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600, margin: 0 }}>
                {row.value}
              </Text>
              {row.hint && (
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0.35rem 0 0 0', lineHeight: 1.45 }}>
                  {row.hint}
                </Text>
              )}
            </Box>
          );
        })}
      </Box>

      {analysis.notes && (
        <Box
          style={{
            marginTop: SPACING.md,
            backgroundColor: COLORS.surfaceElevated,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            borderLeft: `3px solid ${COLORS.accent}`,
          }}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0, lineHeight: 1.55 }}>
            {analysis.notes}
          </Text>
        </Box>
      )}
    </Box>
  );
};
