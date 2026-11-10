import { useState, useCallback, useEffect } from 'react';
import type { AlgorithmTrace } from '../../core/visualization/types';
import { visualizationEngine } from '../../core/visualization/generators';
import { DEFAULT_VISUALIZATION_CONFIG } from '../../core/visualization/types';

type UseVisualizationOptions = {
  algorithmId: string;
  input: unknown;
  autoStart?: boolean;
};

export function useVisualization({
  algorithmId,
  input,
  autoStart = false,
}: UseVisualizationOptions) {
  const [trace, setTrace] = useState<AlgorithmTrace | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);

  const totalSteps = trace?.steps.length ?? 0;
  const currentStep = trace?.steps[currentStepIndex] ?? undefined;
  const canGoNext = currentStepIndex < totalSteps - 1;
  const canGoPrevious = currentStepIndex > 0;

  const generateTrace = useCallback(
    async (inputData: unknown) => {
      setIsGenerating(true);
      setError(undefined);
      try {
        const result = visualizationEngine.generateTrace(
          algorithmId,
          inputData,
          DEFAULT_VISUALIZATION_CONFIG
        );
        if (result.trace) {
          setTrace(result.trace);
          setCurrentStepIndex(0);
          setIsPlaying(false);
        } else {
          setError(result.error);
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [algorithmId]
  );

  useEffect(() => {
    if (autoStart && input) {
      generateTrace(input);
    }
  }, [autoStart, input, generateTrace]);

  const startVisualization = useCallback(
    (inputData: unknown) => {
      generateTrace(inputData);
    },
    [generateTrace]
  );

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const nextStep = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);
  const previousStep = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);
  const restart = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);
  const jumpToStep = useCallback((index: number) => {
    setIsPlaying(false);
    setCurrentStepIndex(Math.max(0, Math.min(index, totalSteps - 1)));
  }, [totalSteps]);
  const setSpeed = useCallback((speed: number) => setPlaybackSpeed(speed), []);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying || !trace) {return;}
    const interval = Math.max(100, Math.floor(1000 / playbackSpeed));
    const id = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, interval);
    return () => clearInterval(id);
  }, [isPlaying, playbackSpeed, trace, totalSteps]);

  return {
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
    startVisualization,
    play,
    pause,
    nextStep,
    previousStep,
    restart,
    jumpToStep,
    setSpeed,
  };
}
