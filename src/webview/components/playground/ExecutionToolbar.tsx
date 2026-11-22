import type { FunctionComponent } from 'react';
import { Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, TYPOGRAPHY } from '../Theme';

interface ExecutionToolbarProps {
  onCompile: () => void;
  onRun: () => void;
  onStop: () => void;
  onRestart: () => void;
  onDebug: () => void;
  onStopDebug: () => void;
  isRunning: boolean;
  isDebugging: boolean;
  canRun: boolean;
  canDebug: boolean;
}

/**
 * The execution toolbar of the playground.
 * Every control is wired to a real action — buttons that cannot work are
 * disabled instead of being shown as active.
 */
export const ExecutionToolbar: FunctionComponent<ExecutionToolbarProps> = ({
  onCompile,
  onRun,
  onStop,
  onRestart,
  onDebug,
  onStopDebug,
  isRunning,
  isDebugging,
  canRun,
  canDebug,
}) => (
  <Flex gap={SPACING.sm} align="center" style={{ flexWrap: 'wrap' } as React.CSSProperties}>
    <Button variant="secondary" size="sm" onClick={onCompile} disabled={isRunning || isDebugging}>
      Compile
    </Button>
    <Button variant="primary" size="sm" onClick={onRun} disabled={!canRun || isRunning || isDebugging}>
      {isRunning ? 'Running…' : 'Run'}
    </Button>
    <Button variant="ghost" size="sm" onClick={onStop} disabled={!isRunning}>
      Stop
    </Button>
    <Button variant="ghost" size="sm" onClick={onRestart} disabled={!canRun || isDebugging}>
      Restart
    </Button>
    {isDebugging ? (
      <Button variant="danger" size="sm" onClick={onStopDebug}>
        Stop Debugging
      </Button>
    ) : (
      <Button variant="secondary" size="sm" onClick={onDebug} disabled={!canDebug || isRunning}>
        Start Debugging
      </Button>
    )}
    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
      {isRunning
        ? 'The program is running — Stop terminates it.'
        : isDebugging
          ? 'The debugger is attached to the program.'
          : 'Programs run locally on your machine with the detected GCC toolchain.'}
    </Text>
  </Flex>
);
