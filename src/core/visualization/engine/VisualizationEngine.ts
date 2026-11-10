import type { AlgorithmTrace, VisualizationConfig } from '../types';

export interface TraceGenerator {
  generate(input: unknown, config: Partial<VisualizationConfig>): AlgorithmTrace;
  validateInput(input: unknown): { valid: boolean; error?: string };
  getDefaultInput(): unknown;
  getPseudocode(): string[];
}

export class VisualizationEngine {
  private generators: Map<string, TraceGenerator> = new Map();

  registerGenerator(algorithmId: string, generator: TraceGenerator): void {
    this.generators.set(algorithmId, generator);
  }

  hasGenerator(algorithmId: string): boolean {
    return this.generators.has(algorithmId);
  }

  getGenerator(algorithmId: string): TraceGenerator | undefined {
    return this.generators.get(algorithmId);
  }

  generateTrace(
    algorithmId: string,
    input: unknown,
    config: Partial<VisualizationConfig> = {}
  ): { trace: AlgorithmTrace | null; error?: string } {
    const generator = this.generators.get(algorithmId);
    if (!generator) {
      return { trace: null, error: `No visualization generator registered for algorithm: ${algorithmId}` };
    }

    const validation = generator.validateInput(input);
    if (!validation.valid) {
      return { trace: null, error: validation.error };
    }

    const trace = generator.generate(input, config);
    return { trace };
  }

  getRegisteredAlgorithmIds(): string[] {
    return Array.from(this.generators.keys());
  }
}

export const visualizationEngine = new VisualizationEngine();
