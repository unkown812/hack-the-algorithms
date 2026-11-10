import type { ExecutionStep, AlgorithmTrace } from '../types';
import { StepManager } from './StepManager';

export type PlaybackEvent =
  | { type: 'PLAYBACK_STARTED' }
  | { type: 'PLAYBACK_PAUSED' }
  | { type: 'PLAYBACK_RESUMED' }
  | { type: 'PLAYBACK_COMPLETED' }
  | { type: 'STEP_CHANGED'; step: ExecutionStep; index: number }
  | { type: 'PLAYBACK_RESET' };

export type PlaybackListener = (event: PlaybackEvent) => void;

export interface ExecutionControllerOptions {
  playbackSpeed: number;
  onEvent?: PlaybackListener;
}

export class ExecutionController {
  private stepManager: StepManager;
  private playbackSpeed: number;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private isPlaying: boolean = false;
  private listeners: Set<PlaybackListener> = new Set();

  constructor(stepManager: StepManager, options: ExecutionControllerOptions) {
    this.stepManager = stepManager;
    this.playbackSpeed = options.playbackSpeed;
    this.listeners = options.onEvent ? new Set([options.onEvent]) : new Set();
  }

  addListener(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: PlaybackEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  getCurrentStep(): ExecutionStep | undefined {
    return this.stepManager.getCurrentStep();
  }

  getNavigation() {
    return this.stepManager.getNavigation();
  }

  getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = speed;
    if (this.isPlaying) {
      this.stopTimer();
      this.startTimer();
    }
  }

  isPlayingBack(): boolean {
    return this.isPlaying;
  }

  private getIntervalMs(): number {
    return Math.max(100, Math.floor(1000 / this.playbackSpeed));
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = setTimeout(() => {
      const advanced = this.stepManager.goNext();
      const step = this.stepManager.getCurrentStep();
      const index = this.stepManager.getNavigation().currentStepIndex;
      if (step && advanced) {
        this.emit({ type: 'STEP_CHANGED', step, index });
      }
      if (advanced && this.isPlaying) {
        this.startTimer();
      } else {
        this.isPlaying = false;
        this.emit({ type: 'PLAYBACK_COMPLETED' });
      }
    }, this.getIntervalMs());
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  play(): void {
    if (this.isPlaying) {return;}
    const nav = this.stepManager.getNavigation();
    if (!nav.canGoNext && this.stepManager.getCurrentStep() === undefined) {
      return;
    }
    this.isPlaying = true;
    this.emit({ type: 'PLAYBACK_STARTED' });
    this.startTimer();
  }

  pause(): void {
    if (!this.isPlaying) {return;}
    this.isPlaying = false;
    this.stopTimer();
    this.emit({ type: 'PLAYBACK_PAUSED' });
  }

  resume(): void {
    this.play();
  }

  nextStep(): boolean {
    const advanced = this.stepManager.goNext();
    if (advanced) {
      const step = this.stepManager.getCurrentStep();
      const index = this.stepManager.getNavigation().currentStepIndex;
      if (step) {
        this.emit({ type: 'STEP_CHANGED', step, index });
      }
    }
    return advanced;
  }

  previousStep(): boolean {
    const advanced = this.stepManager.goPrevious();
    if (advanced) {
      const step = this.stepManager.getCurrentStep();
      const index = this.stepManager.getNavigation().currentStepIndex;
      if (step) {
        this.emit({ type: 'STEP_CHANGED', step, index });
      }
    }
    return advanced;
  }

  restart(): void {
    this.pause();
    this.stepManager.goToBeginning();
    const step = this.stepManager.getCurrentStep();
    const index = this.stepManager.getNavigation().currentStepIndex;
    this.emit({ type: 'PLAYBACK_RESET' });
    if (step) {
      this.emit({ type: 'STEP_CHANGED', step, index });
    }
  }

  jumpToStep(index: number): boolean {
    const advanced = this.stepManager.goToStep(index);
    if (advanced) {
      const step = this.stepManager.getCurrentStep();
      const navIndex = this.stepManager.getNavigation().currentStepIndex;
      this.emit({ type: 'STEP_CHANGED', step: step as ExecutionStep, index: navIndex });
    }
    return advanced;
  }

  getTrace(): AlgorithmTrace | null {
    return this.stepManager.getTrace();
  }

  setTrace(trace: AlgorithmTrace): void {
    this.pause();
    this.stepManager.setTrace(trace);
    const step = this.stepManager.getCurrentStep();
    const index = this.stepManager.getNavigation().currentStepIndex;
    this.emit({ type: 'PLAYBACK_RESET' });
    if (step) {
      this.emit({ type: 'STEP_CHANGED', step, index });
    }
  }

  dispose(): void {
    this.pause();
    this.listeners.clear();
  }
}
