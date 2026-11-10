import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { ExecutionResult } from '../../../core/playground/types';

interface ConsolePanelProps {
  result: ExecutionResult | null;
  /** Output produced by the debugger while the program ran. */
  debugOutput?: string;
  onClear: () => void;
}

type ConsoleTab = 'stdout' | 'stderr';

/**
 * Terminal style console that shows the program output, the compiler
 * diagnostics and the execution status.
 */
export const ConsolePanel: FunctionComponent<ConsolePanelProps> = ({
  result,
  debugOutput = '',
  onClear,
}) => {
  const [tab, setTab] = useState<ConsoleTab>('stdout');

  const stdout = result?.stdout ?? debugOutput;
  const stderr = result?.stderr ?? '';
  const content = tab === 'stdout' ? stdout : stderr;

  const statusLabel = (): string => {
    if (!result) {
      return 'No run yet';
    }
    switch (result.status) {
    case 'success':
      return `Finished successfully in ${result.durationMs} ms (exit code ${result.exitCode ?? 0})`;
    case 'compile-error':
      return 'Compilation failed — the program was not executed';
    case 'runtime-error':
      return `Runtime error — exit code ${result.exitCode ?? 'unknown'}`;
    case 'timeout':
      return 'Stopped: the program exceeded the time limit';
    case 'cancelled':
      return 'Stopped by the user';
    default:
      return result.status;
    }
  };

  const statusColor = (): string => {
    if (!result) {
      return COLORS.textMuted;
    }
    switch (result.status) {
    case 'success':
      return COLORS.success;
    case 'compile-error':
    case 'runtime-error':
      return COLORS.error;
    case 'timeout':
    case 'cancelled':
      return COLORS.warning;
    default:
      return COLORS.textMuted;
    }
  };

  return (
    <Box
      style={{
        backgroundColor: '#0b1220',
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
      }}
    >
      <Flex
        gap={SPACING.sm}
        align="center"
        justify="between"
        style={{ padding: `${SPACING.sm} ${SPACING.md}`, borderBottom: `1px solid ${COLORS.border}` } as React.CSSProperties}
      >
        <Flex gap={SPACING.xs}>
          <Button variant={tab === 'stdout' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('stdout')}>
            Output
          </Button>
          <Button variant={tab === 'stderr' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('stderr')}>
            Errors
          </Button>
        </Flex>
        <Flex gap={SPACING.sm} align="center">
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: statusColor(), margin: 0 }}>
            {statusLabel()}
          </Text>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        </Flex>
      </Flex>

      <Box
        style={{
          padding: SPACING.md,
          minHeight: 120,
          maxHeight: 260,
          overflow: 'auto',
          fontFamily: '"SF Mono", Menlo, Consolas, monospace',
          fontSize: '0.78rem',
          lineHeight: 1.55,
          color: tab === 'stderr' ? COLORS.warning : COLORS.textPrimary,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content.length > 0 ? content : <span style={{ color: COLORS.textMuted }}>{tab === 'stdout' ? 'The program has not printed anything yet.' : 'No errors were reported.'}</span>}
        {result?.outputTruncated && (
          <div style={{ color: COLORS.warning, marginTop: SPACING.sm }}>
            Output was truncated because it exceeded the configured size limit.
          </div>
        )}
      </Box>

      {result?.commandLine && (
        <Text
          as="p"
          style={{
            ...TYPOGRAPHY.small,
            color: COLORS.textMuted,
            margin: 0,
            padding: `${SPACING.sm} ${SPACING.md}`,
            borderTop: `1px solid ${COLORS.border}`,
            fontFamily: '"SF Mono", Menlo, monospace',
            fontSize: '0.7rem',
            wordBreak: 'break-all',
          }}
        >
          {result.commandLine}
        </Text>
      )}
    </Box>
  );
};
