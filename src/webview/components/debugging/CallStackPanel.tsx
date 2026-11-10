import type { FunctionComponent } from 'react';
import { Box, Flex, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { CallStackFrame } from '../../../core/playground/types';

interface CallStackPanelProps {
  frames: CallStackFrame[];
  onSelectFrame?: (frame: CallStackFrame) => void;
}

/** Shows the call stack of the paused program. */
export const CallStackPanel: FunctionComponent<CallStackPanelProps> = ({
  frames,
  onSelectFrame,
}) => {
  if (frames.length === 0) {
    return (
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
        No call stack available.
      </Text>
    );
  }

  return (
    <Box style={{ display: 'grid', gap: 2 }}>
      {frames.map((frame, index) => (
        <Flex
          key={`${frame.level}-${index}`}
          gap={SPACING.sm}
          align="center"
          onClick={() => onSelectFrame?.(frame)}
          style={{
            cursor: onSelectFrame ? 'pointer' : 'default',
            padding: `${SPACING.xs} ${SPACING.sm}`,
            borderRadius: RADIUS.sm,
            backgroundColor: index === 0 ? 'rgba(59,130,246,0.14)' : 'transparent',
            fontFamily: '"SF Mono", Menlo, monospace',
            fontSize: '0.74rem',
          } as React.CSSProperties}
        >
          <Text as="span" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0, minWidth: 18 }}>
            #{frame.level}
          </Text>
          <Text as="span" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0 }}>
            {frame.functionName}()
          </Text>
          <Text as="span" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
            {frame.file ? `${frame.file}:${frame.line}` : ''}
          </Text>
        </Flex>
      ))}
    </Box>
  );
};
