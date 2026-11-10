import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { OperationMetrics } from '../../../core/complexity/types/OperationMetrics';
import type { CountingConvention } from '../../../core/complexity/counters/engine/CountingConventions';

interface OperationMetricsProps {
  metrics: OperationMetrics;
  title?: string;
  /** Optional convention describing which counters this algorithm uses. */
  convention?: CountingConvention;
  /** Marks counters that are unsupported for this algorithm as “n/a”. */
  relevantCounters?: ReadonlyArray<keyof OperationMetrics>;
}

type CounterKey = keyof Omit<OperationMetrics, 'totalOperations'>;

const COUNTER_KEYS: Array<{ key: CounterKey | 'totalOperations'; label: string }> = [
  { key: 'totalOperations', label: 'Total Operations' },
  { key: 'comparisons', label: 'Comparisons' },
  { key: 'swaps', label: 'Swaps' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'arrayAccesses', label: 'Array Accesses' },
  { key: 'arrayWrites', label: 'Array Writes' },
  { key: 'loopIterations', label: 'Loop Iterations' },
  { key: 'recursiveCalls', label: 'Recursive Calls' },
  { key: 'functionCalls', label: 'Function Calls' },
  { key: 'arithmeticOperations', label: 'Arithmetic Ops' },
  { key: 'allocations', label: 'Allocations' },
  { key: 'deallocations', label: 'Deallocations' },
];

export const OperationMetricsDisplay: FunctionComponent<OperationMetricsProps> = ({  metrics,
  title = 'Operation Counts (instrumented)',
  convention,
  relevantCounters,
}) => {
  const [showConvention, setShowConvention] = useState(false);
  const relevant =
    relevantCounters ??
    (convention
      ? convention.relevantCounters
      : (Object.keys(metrics) as Array<keyof OperationMetrics>));

  const items = COUNTER_KEYS.map((entry) => {
    const value = metrics[entry.key as keyof OperationMetrics];
    const applicable = entry.key === 'totalOperations' || relevant.includes(entry.key);
    return { ...entry, value, applicable };
  });

  // The total is always shown; counters relevant to this algorithm are always
  // shown even at 0; counters the algorithm never produces are omitted (per
  // the “unsupported ≠ zero” convention the value stays 0 and is labelled n/a).
  const shown = items.filter((item) => item.key === 'totalOperations' || item.applicable);

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      }}
    >
      <Flex justify="between" align="center" style={{ flexWrap: 'wrap', gap: SPACING.sm } as React.CSSProperties}>
        <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: 0 }}>
          {title}
        </Text>
        {convention && (
          <Button variant="ghost" size="sm" onClick={() => setShowConvention(!showConvention)}>
            {showConvention ? 'Hide' : 'Show'} counting convention
          </Button>
        )}
      </Flex>

      {convention && (
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0.5rem 0 0 0' }}>
          {convention.summary} Counters this algorithm does not use stay 0 and are documented as not applicable rather than estimated.
        </Text>
      )}

      <Flex gap={SPACING.md} style={{ flexWrap: 'wrap', marginTop: SPACING.md } as React.CSSProperties}>
        {shown.map((item) => (
          <Box
            key={item.label}
            style={{
              backgroundColor: item.key === 'totalOperations' ? COLORS.accent + '20' : COLORS.surfaceElevated,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              textAlign: 'center',
              minWidth: 100,
              border: item.key === 'totalOperations' ? `1px solid ${COLORS.accent}` : 'none',
            }}
            title={item.applicable ? undefined : `${item.label}: this implementation does not produce this operation type`}
          >
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' }}>
              {item.label}
            </Text>
            <Text
              as="p"
              style={{
                ...TYPOGRAPHY.body,
                color: item.key === 'totalOperations' ? COLORS.accent : COLORS.textPrimary,
                fontWeight: 600,
                margin: 0,
              }}
            >
              {item.value.toLocaleString()}
              {!item.applicable && <span style={{ color: COLORS.textMuted }}> (n/a)</span>}
            </Text>
          </Box>
        ))}
      </Flex>

      {convention && showConvention && (
        <Box
          style={{
            marginTop: SPACING.md,
            backgroundColor: COLORS.surfaceElevated,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
          }}
        >
          {convention.details.map((detail, i) => (
            <Text key={i} as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0.35rem 0', lineHeight: 1.5 }}>
              • {detail}
            </Text>
          ))}
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0.5rem 0 0 0', lineHeight: 1.5 }}>
            A swap counts as ONE swap; its two underlying element reads and two writes are tracked separately under array
            accesses and array writes. The scalar temp assignment of a swap is tracked under assignments. The displayed
            total sums all visible counters using that convention.
          </Text>
        </Box>
      )}
    </Box>
  );
};
