import { FunctionComponent, useState } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../components/Theme';
import type { Algorithm } from '../../core/algorithms';
import {
  ArrayRenderer,
  InputEditor,
  PlaybackControls,
  StepTimeline,
  ExecutionExplanation,
  VariableInspector,
  ComplexityIndicator,
} from '../components/visualization';
import { useVisualization } from '../hooks';
import { visualizationEngine } from '../../core/visualization/generators';

type Props = {
  algorithm: Algorithm | undefined;
  onBack: () => void;
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: COLORS.success,
  Intermediate: COLORS.warning,
  Advanced: COLORS.error,
};

export const AlgorithmVisualizer: FunctionComponent<Props> = ({
  algorithm,
  onBack,
}) => {
  const [input, setInput] = useState<unknown>(null);

  if (!algorithm) {
    return (
      <Box
        style={{
          padding: SPACING['2xl'],
          maxWidth: 1200,
          margin: '0 auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: COLORS.textPrimary,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        } as React.CSSProperties}
      >
        <Text as="h1" style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}>
          Algorithm Not Found
        </Text>
        <Button variant="ghost" onClick={onBack} style={{ marginTop: SPACING.lg } as React.CSSProperties}>
          ← Back to Library
        </Button>
      </Box>
    );
  }

  const generator = visualizationEngine.getGenerator(algorithm.id);
  const defaultInput = generator ? generator.getDefaultInput() : null;
  const pseudocode = generator ? generator.getPseudocode() : algorithm.pseudocode;

  const {
    trace,
    currentStep,
    currentStepIndex,
    totalSteps,
    isPlaying,
    playbackSpeed,
    error,
    isGenerating,
    canGoNext,
    canGoPrevious,
    generateTrace,
    play,
    pause,
    nextStep,
    previousStep,
    restart,
    jumpToStep,
    setSpeed,
  } = useVisualization({
    algorithmId: algorithm.id,
    input: input,
    autoStart: false,
  });

  const handleValidate = () => {
    if (!generator) {return { valid: false, error: 'No generator available.' };}
    return generator.validateInput(input);
  };

  const handleStart = (inputData: unknown) => {
    setInput(inputData);
    generateTrace(inputData);
  };

  const currentCounters = currentStep?.complexity ?? {
    operations: 0,
    comparisons: 0,
    swaps: 0,
    iterations: 0,
  };
  const currentVariables = currentStep?.variables ?? {};

  return (
    <Box
      style={{
        padding: SPACING['2xl'],
        maxWidth: 1400,
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: COLORS.textPrimary,
      } as React.CSSProperties}
    >
      <Box style={{ marginBottom: SPACING.lg }}>
        <Button variant="ghost" onClick={onBack}>
          ← Back to {algorithm.name} Details
        </Button>
      </Box>

      <Box style={{ marginBottom: SPACING.xl }}>
        <Flex justify="between" align="start" style={{ flexWrap: 'wrap', gap: SPACING.md } as React.CSSProperties}>
          <Box>
            <Text as="h1" style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}>
              Visualize: {algorithm.name}
            </Text>
            <Flex gap={SPACING.md} style={{ marginTop: SPACING.sm, flexWrap: 'wrap' } as React.CSSProperties}>
              <Box
                style={{
                  backgroundColor: COLORS.surfaceElevated,
                  color: COLORS.textSecondary,
                  padding: '0.25rem 0.75rem',
                  borderRadius: RADIUS.md,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                } as React.CSSProperties}
              >
                {algorithm.category}
              </Box>
              <Box
                style={{
                  backgroundColor: DIFFICULTY_COLORS[algorithm.difficulty] + '20',
                  color: DIFFICULTY_COLORS[algorithm.difficulty],
                  padding: '0.25rem 0.75rem',
                  borderRadius: RADIUS.md,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                } as React.CSSProperties}
              >
                {algorithm.difficulty}
              </Box>
              <Box
                style={{
                  backgroundColor: COLORS.surfaceElevated,
                  color: COLORS.textSecondary,
                  padding: '0.25rem 0.75rem',
                  borderRadius: RADIUS.md,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                } as React.CSSProperties}
              >
                {trace ? trace.status : 'Idle'}
              </Box>
            </Flex>
          </Box>
          <Box
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              minWidth: 160,
              textAlign: 'center',
            } as React.CSSProperties}
          >
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 } as React.CSSProperties}>
              Worst Time
            </Text>
            <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600, margin: '0.25rem 0 0 0' } as React.CSSProperties}>
              {algorithm.timeComplexity.worst}
            </Text>
          </Box>
        </Flex>
      </Box>

      <InputEditor
        array={(input as { array?: number[] })?.array ?? (defaultInput as { array?: number[] })?.array ?? []}
        target={(input as { target?: number })?.target ?? (defaultInput as { target?: number })?.target}
        algorithm={algorithm.id}
        onInputChange={setInput}
        onValidate={handleValidate}
        onStart={handleStart}
        isRunning={isPlaying || isGenerating}
        error={error}
      />

      <Flex gap={SPACING.xl} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
        <Box style={{ marginTop: SPACING.xl } as React.CSSProperties}>
          <Text as="h2" style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: '0 0 1rem 0' } as React.CSSProperties}>
            Visualization Canvas
          </Text>
          <Box
            style={{
              backgroundColor: '#0f172a',
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              minHeight: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            } as React.CSSProperties}
          >
            {trace && currentStep ? (
              <ArrayRenderer array={currentStep.currentState.array ?? { values: [], length: 0, elementStyles: {} }} />
            ) : (
              <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted, margin: 0 } as React.CSSProperties}>
                Configure input and start visualization to see the array.
              </Text>
            )}
          </Box>
        </Box>

        <Box style={{ flex: '1 1 400px', minWidth: 300 } as React.CSSProperties}>
          <ExecutionExplanation step={currentStep} />
          <Box style={{ marginTop: SPACING.lg } as React.CSSProperties}>
            <VariableInspector variables={currentVariables} />
          </Box>
          <Box style={{ marginTop: SPACING.lg } as React.CSSProperties}>
            <ComplexityIndicator
              counters={currentCounters}
              theoretical={algorithm.timeComplexity}
            />
          </Box>
        </Box>
      </Flex>

      {trace && totalSteps > 0 && (
        <Box style={{ marginTop: SPACING.xl } as React.CSSProperties}>
          <Flex justify="between" align="center" style={{ marginBottom: SPACING.md } as React.CSSProperties}>
            <Text as="h2" style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}>
              Playback
            </Text>
            <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: 0 } as React.CSSProperties}>
              Step {currentStepIndex + 1} of {totalSteps}
            </Text>
          </Flex>
          <PlaybackControls
            isPlaying={isPlaying}
            currentStep={currentStepIndex}
            totalSteps={totalSteps}
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
            playbackSpeed={playbackSpeed}
            onPlayPause={isPlaying ? pause : play}
            onNext={nextStep}
            onPrevious={previousStep}
            onRestart={restart}
            onJumpBeginning={() => jumpToStep(0)}
            onJumpEnd={() => jumpToStep(totalSteps - 1)}
            onSpeedChange={setSpeed}
            onStepChange={jumpToStep}
          />
          <StepTimeline
            stepIndex={currentStepIndex}
            totalSteps={totalSteps}
            onStepClick={jumpToStep}
          />
        </Box>
      )}

      {pseudocode && pseudocode.length > 0 && (
        <Box style={{ marginTop: SPACING.xl } as React.CSSProperties}>
          <Text as="h2" style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: '0 0 1rem 0' } as React.CSSProperties}>
            Pseudocode
          </Text>
          <Box
            style={{
              backgroundColor: '#0f172a',
              borderRadius: RADIUS.md,
              padding: SPACING.lg,
              overflowX: 'auto',
              maxHeight: 300,
              overflowY: 'auto',
            } as React.CSSProperties}
          >
            {pseudocode.map((line: string, i: number) => {
              const isHighlighted = currentStep?.lineNumber !== undefined && i + 1 === currentStep.lineNumber;
              return (
                <Text
                  key={i}
                  as="div"
                  style={{
                    color: isHighlighted ? COLORS.accent : COLORS.textSecondary,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    paddingLeft: isHighlighted ? '0.5rem' : 0,
                    borderLeft: isHighlighted ? `3px solid ${COLORS.accent}` : 'none',
                  } as React.CSSProperties}
                >
                  {line}
                </Text>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};
