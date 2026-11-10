import type {
  ExecutionStep,
  AlgorithmTrace,
  VisualizationState,
} from '../types';

export interface StepNavigation {
  currentStepIndex: number;
  totalSteps: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export class StepManager {
  private trace: AlgorithmTrace | null = null;
  private currentStepIndex: number = 0;

  setTrace(trace: AlgorithmTrace): void {
    this.trace = trace;
    this.currentStepIndex = 0;
  }

  getCurrentStep(): ExecutionStep | undefined {
    if (!this.trace) {return undefined;}
    return this.trace.steps[this.currentStepIndex];
  }

  getTrace(): AlgorithmTrace | null {
    return this.trace;
  }

  getNavigation(): StepNavigation {
    const totalSteps = this.trace ? this.trace.steps.length : 0;
    return {
      currentStepIndex: this.currentStepIndex,
      totalSteps,
      canGoNext: this.currentStepIndex < totalSteps - 1,
      canGoPrevious: this.currentStepIndex > 0,
    };
  }

  goToStep(index: number): boolean {
    if (!this.trace) {return false;}
    const clamped = Math.max(0, Math.min(index, this.trace.steps.length - 1));
    this.currentStepIndex = clamped;
    return true;
  }

  goNext(): boolean {
    if (!this.trace || this.currentStepIndex >= this.trace.steps.length - 1) {
      return false;
    }
    this.currentStepIndex += 1;
    return true;
  }

  goPrevious(): boolean {
    if (!this.trace || this.currentStepIndex <= 0) {
      return false;
    }
    this.currentStepIndex -= 1;
    return true;
  }

  goToBeginning(): boolean {
    if (!this.trace || this.trace.steps.length === 0) {return false;}
    this.currentStepIndex = 0;
    return true;
  }

  goToEnd(): boolean {
    if (!this.trace || this.trace.steps.length === 0) {return false;}
    this.currentStepIndex = this.trace.steps.length - 1;
    return true;
  }

  reset(): void {
    this.currentStepIndex = 0;
  }

  getCurrentState(): VisualizationState | undefined {
    const step = this.getCurrentStep();
    return step ? step.currentState : undefined;
  }
}
