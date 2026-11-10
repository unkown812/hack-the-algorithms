import type { FunctionComponent } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { CompilerInfo, DebuggerInfo } from '../../../core/playground/types';

interface CompilerStatusProps {
  compiler: CompilerInfo | null;
  debuggerInfo?: DebuggerInfo | null;
  onRefresh: () => void;
}

/**
 * Shows whether a real C compiler (and debugger) is available on this
 * machine. Nothing is ever simulated: when the toolchain is missing the panel
 * explains how to install it.
 */
export const CompilerStatus: FunctionComponent<CompilerStatusProps> = ({
  compiler,
  debuggerInfo,
  onRefresh,
}) => {
  if (!compiler) {
    return (
      <Flex gap={SPACING.sm} align="center">
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
          Checking for a local C compiler…
        </Text>
      </Flex>
    );
  }

  const available = compiler.available && compiler.verified;
  const statusColor = available ? COLORS.success : COLORS.warning;

  return (
    <Box>
      <Flex gap={SPACING.sm} align="center" style={{ flexWrap: 'wrap' } as React.CSSProperties}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: statusColor,
            display: 'inline-block',
          }}
        />
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
          {available ? 'GCC ready' : compiler.available ? 'GCC found but not verified' : 'No C compiler'}
        </Text>
        {compiler.version && (
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
            {compiler.version}
          </Text>
        )}
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          Re-check
        </Button>
      </Flex>

      {compiler.executablePath && (
        <Text
          as="p"
          style={{
            ...TYPOGRAPHY.small,
            color: COLORS.textMuted,
            margin: `${SPACING.xs} 0 0 0`,
            fontFamily: '"SF Mono", Menlo, monospace',
            fontSize: '0.72rem',
            wordBreak: 'break-all',
          }}
        >
          {compiler.executablePath}
        </Text>
      )}

      {!available && (
        <Box
          style={{
            marginTop: SPACING.sm,
            padding: SPACING.sm,
            borderRadius: RADIUS.sm,
            border: `1px solid ${COLORS.warning}`,
            backgroundColor: `${COLORS.warning}18`,
          }}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0 }}>
            {compiler.unavailableReason ??
              'The compiler was detected but a test program could not be compiled and run.'}
          </Text>
          {compiler.installHint && (
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: `${SPACING.xs} 0 0 0` }}>
              {compiler.installHint}
            </Text>
          )}
        </Box>
      )}

      {debuggerInfo && !debuggerInfo.available && (
        <Box
          style={{
            marginTop: SPACING.sm,
            padding: SPACING.sm,
            borderRadius: RADIUS.sm,
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.surfaceElevated,
          }}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0 }}>
            {debuggerInfo.unavailableReason} {debuggerInfo.installHint}
          </Text>
        </Box>
      )}
    </Box>
  );
};
