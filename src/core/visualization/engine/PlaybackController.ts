import type { AlgorithmTrace } from '../types';

export interface PlaybackConfig {
  speed: number;
  isPlaying: boolean;
  currentStepIndex: number;
  totalSteps: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export class PlaybackController {
  private speed: number = 1;
  private isPlaying: boolean = false;
  private currentStepIndex: number = 0;
  private totalSteps: number = 0;
  private onStateChange?: (config: PlaybackConfig) => void;

  setTrace(trace: AlgorithmTrace): void {
    this.currentStepIndex = 0;
    this.totalSteps = trace.steps.length;
    this.isPlaying = false;
    this.notify();
  }

  setOnStateChange(handler: (config: PlaybackConfig) => void): void {
    this.onStateChange = handler;
  }

  getConfig(): PlaybackConfig {
    return {
      speed: this.speed,
      isPlaying: this.isPlaying,
      currentStepIndex: this.currentStepIndex,
      totalSteps: this.totalSteps,
      canGoNext: this.currentStepIndex < this.totalSteps - 1,
      canGoPrevious: this.currentStepIndex > 0,
    };
  }

  setSpeed(speed: number): void {
    this.speed = speed;
    this.notify();
  }

  setPlaying(playing: boolean): void {
    this.isPlaying = playing;
    this.notify();
  }

  setCurrentStepIndex(index: number): void {
    this.currentStepIndex = Math.max(0, Math.min(index, this.totalSteps - 1));
    this.notify();
  }

  setTotalSteps(total: number): void {
    this.totalSteps = total;
    this.notify();
  }

  reset(): void {
    this.currentStepIndex = 0;
    this.isPlaying = false;
    this.notify();
  }

  private notify(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getConfig());
    }
  }
}
