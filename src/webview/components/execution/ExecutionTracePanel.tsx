import type { FunctionComponent } from 'react';
import { Box, Flex, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import { ArrayRenderer } from '../visualization/ArrayRenderer';
import type { DebugSessionState, TraceEvent } from '../../../core/playground/types';

interface ExecutionTracePanelProps {
  state: DebugSessionState;
  events: TraceEvent[];
}

/**
 * Bridges the real debug session to the Phase 2 visualization.
 *
 * The array renderer shows the values the debugger read from the student's
 * program. The counters below are only shown as reliable when they were
 * derived from the source analysis — otherwise the panel says so instead of
 * showing invented numbers.
 */
export const ExecutionTracePanel: FunctionComponent<ExecutionTracePanelProps> = ({
  state,
  events,
}) => {
  const latest = events[events.length - 1];
  const arrayValues = latest?.arrayValues;

  return (
    <Box style={{ display: 'grid', gap: SPACING.md }}>
      <Box>
        <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
          Live array state
        </Text>
        {arrayValues && arrayValues.length > 0 ? (
          <ArrayRenderer
            array={{
              values: arrayValues,
              length: arrayValues.length,
              elementStyles: {},
            }}
            showValues
            showIndices
          />
        ) : (
          <Box
            style={{
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surfaceElevated,
            }}
          >
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
              The array of the running program is shown here once the debugger reports its contents. Programs that do
              not use a numeric array simply have nothing to visualise.
            </Text>
          </Box>
        )}
      </Box>

      <Box>
        <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
          Operation counters
        </Text>
        <Flex gap={SPACING.md} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
          <Counter label="Comparisons" value={state.counters.comparisons} />
          <Counter label="Exchanges" value={state.counters.swaps} />
          <Counter label="Loop iterations" value={state.counters.iterations} />
        </Flex>
        <Text
          as="p"
          style={{
            ...TYPOGRAPHY.small,
            color: state.counters.reliable ? COLORS.textSecondary : COLORS.warning,
            margin: `${SPACING.sm} 0 0 0`,
          }}
        >
          {state.counters.reliable
            ? state.counters.note
            : 'These counters could not be derived reliably from the source. Only source-line and variable information is shown.'}
        </Text>
      </Box>

      <Box>
        <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
          Trace events ({events.length})
        </Text>
        {events.length === 0 ? (
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
            No trace events yet — start the debugger and step through the program.
          </Text>
        ) : (
          <Box
            style={{
              maxHeight: 220,
              overflow: 'auto',
              backgroundColor: '#0b1220',
              borderRadius: RADIUS.sm,
              padding: SPACING.sm,
              fontFamily: '"SF Mono", Menlo, monospace',
              fontSize: '0.72rem',
              lineHeight: 1.6,
            }}
          >
            {events
              .slice(-80)
              .reverse()
              .map((event) => (
                <div key={event.id} style={{ color: COLORS.textSecondary }}>
                  <span style={{ color: COLORS.accent }}>#{event.sequence}</span>{' '}
                  <span style={{ color: COLORS.textMuted }}>line {event.line}</span>{' '}
                  {event.description}
                </div>
              ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

const Counter: FunctionComponent<{ label: string; value: number }> = ({ label, value }) => (
  <Box
    style={{
      padding: `${SPACING.sm} ${SPACING.md}`,
      borderRadius: RADIUS.sm,
      backgroundColor: COLORS.surfaceElevated,
      minWidth: 110,
    }}
  >
    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS.textPrimary }}>{value.toLocaleString()}</div>
    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
      {label}
    </Text>
  </Box>
);
