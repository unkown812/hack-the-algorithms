import type { FunctionComponent } from 'react';
import { Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, TYPOGRAPHY } from '../Theme';
import type { DebugSessionState } from '../../../core/playground/types';

interface DebugControlsProps {
  state: DebugSessionState;
  onStart: () => void;
  onContinue: () => void;
  onStepOver: () => void;
  onStepInto: () => void;
  onStepOut: () => void;
  onRestart: () => void;
  onStop: () => void;
  debuggerAvailable: boolean;
}

/**
 * The debugging controls.
 * When no debugger is installed the controls are disabled and the reason is
 * shown instead of offering buttons that cannot work.
 */
export const DebugControls: FunctionComponent<DebugControlsProps> = ({
  state,
  onStart,
  onContinue,
  onStepOver,
  onStepInto,
  onStepOut,
  onRestart,
  onStop,
  debuggerAvailable,
}) => {
  const active = state.status === 'paused' || state.status === 'running';

  if (!debuggerAvailable) {
    return (
      <Flex gap={SPACING.sm} align="center">
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.warning, margin: 0 }}>
          No GDB debugger was found on this machine, so debugging is unavailable. The compiler, the runner and the
          execution tracing still work.
        </Text>
      </Flex>
    );
  }

  return (
    <Flex gap={SPACING.sm} align="center" style={{ flexWrap: 'wrap' } as React.CSSProperties}>
      {state.status === 'idle' || state.status === 'stopped' || state.status === 'error' ? (
        <Button variant="primary" size="sm" onClick={onStart}>
          Start Debugging
        </Button>
      ) : (
        <>
          <Button variant="secondary" size="sm" onClick={onContinue} disabled={!active}>
            Continue
          </Button>
          <Button variant="ghost" size="sm" onClick={onStepOver} disabled={!active}>
            Step Over
          </Button>
          <Button variant="ghost" size="sm" onClick={onStepInto} disabled={!active}>
            Step Into
          </Button>
          <Button variant="ghost" size="sm" onClick={onStepOut} disabled={!active}>
            Step Out
          </Button>
          <Button variant="ghost" size="sm" onClick={onRestart} disabled={!active}>
            Restart
          </Button>
          <Button variant="danger" size="sm" onClick={onStop}>
            Stop
          </Button>
        </>
      )}

      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
        {state.status === 'paused'
          ? `Paused at line ${state.currentLine ?? '?'}${state.currentFunction ? ` in ${state.currentFunction}()` : ''}`
          : state.status === 'running'
            ? 'The program is running…'
            : state.status === 'stopped'
              ? 'The program finished.'
              : state.message ?? 'Ready to debug.'}
      </Text>
    </Flex>
  );
};
