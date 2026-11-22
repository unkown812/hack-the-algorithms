import type { FunctionComponent } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';

type Props = {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  playbackSpeed: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onRestart: () => void;
  onJumpBeginning: () => void;
  onJumpEnd: () => void;
  onSpeedChange: (speed: number) => void;
  onStepChange: (index: number) => void;
};

export const PlaybackControls: FunctionComponent<Props> = ({
  isPlaying,
  currentStep,
  totalSteps,
  canGoNext,
  canGoPrevious,
  playbackSpeed,
  onPlayPause,
  onNext,
  onPrevious,
  onRestart,
  onJumpBeginning,
  onJumpEnd,
  onSpeedChange,
  onStepChange,
}) => {
  const speedOptions = [0.25, 0.5, 1, 1.5, 2, 4];

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      } as React.CSSProperties}
    >
      <Text
        as="h3"
        style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 1rem 0' } as React.CSSProperties}
      >
        Playback Controls
      </Text>

      <Flex gap={SPACING.sm} align="center" justify="center">
        <Button
          variant="ghost"
          onClick={onJumpBeginning}
          disabled={!canGoPrevious}
        >
          ⏮
        </Button>
        <Button
          variant="ghost"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          ⏪
        </Button>
        <Button
          variant="primary"
          onClick={onPlayPause}
        >
          {isPlaying ? '⏸' : '▶'}
        </Button>
        <Button
          variant="ghost"
          onClick={onNext}
          disabled={!canGoNext}
        >
          ⏩
        </Button>
        <Button
          variant="ghost"
          onClick={onJumpEnd}
          disabled={!canGoNext}
        >
          ⏭
        </Button>
        <Button variant="secondary" onClick={onRestart}>
          ⟳
        </Button>
      </Flex>

      <Box style={{ marginTop: SPACING.md } as React.CSSProperties}>
        <Flex justify="between" align="center">
          <Text
            as="span"
            style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontSize: '0.875rem' } as React.CSSProperties}
          >
            Step {currentStep + 1} of {totalSteps}
          </Text>
          <Text
            as="span"
            style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600, fontSize: '0.875rem' } as React.CSSProperties}
          >
            {isPlaying ? 'Playing' : 'Paused'}
          </Text>
        </Flex>
        <input
          type="range"
          min="0"
          max={Math.max(totalSteps - 1, 0)}
          value={currentStep}
          onChange={(e) => onStepChange(Number((e.target as HTMLInputElement).value))}
          disabled={totalSteps <= 1}
          style={{
            width: '100%',
            marginTop: SPACING.sm,
            accentColor: COLORS.accent,
          } as unknown as React.CSSProperties}
        />
      </Box>

      <Box style={{ marginTop: SPACING.md } as React.CSSProperties}>
        <Text
          as="span"
          style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontSize: '0.875rem', marginRight: SPACING.sm } as React.CSSProperties}
        >
          Speed:
        </Text>
        <select
          value={playbackSpeed}
          onChange={(e) => onSpeedChange(Number((e.target as HTMLSelectElement).value))}
          style={{
            padding: '0.375rem 0.75rem',
            backgroundColor: COLORS.surfaceElevated,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.md,
            color: COLORS.textPrimary,
            fontSize: '0.875rem',
          } as unknown as React.CSSProperties}
        >
          {speedOptions.map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>
      </Box>
    </Box>
  );
};
