export type InputScenario =
  | 'target-beginning'
  | 'target-middle'
  | 'target-end'
  | 'target-not-found'
  | 'random-target'
  | 'duplicate-target'
  | 'already-sorted'
  | 'reverse-sorted'
  | 'random-order'
  | 'nearly-sorted'
  | 'duplicate-heavy'
  | 'custom';

export interface InputGeneratorOptions {
  size: number;
  scenario: InputScenario;
  seed?: number;
  valueRange?: [number, number];
  customData?: number[];
}

export class InputGenerator {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  private random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /** Seeded pseudo-random integer within [min, max] — exposed for reuse by the input lab. */
  range(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  generate(options: InputGeneratorOptions): number[] {
    const { size, scenario, valueRange = [1, 1000], customData } = options;

    if (customData && customData.length > 0) {
      return [...customData];
    }

    if (size <= 0) {return [];}

    switch (scenario) {
    case 'already-sorted':
      return this.generateSorted(size, valueRange);
    case 'reverse-sorted':
      return this.generateReverseSorted(size, valueRange);
    case 'random-order':
      return this.generateRandom(size, valueRange);
    case 'nearly-sorted':
      return this.generateNearlySorted(size, valueRange);
    case 'duplicate-heavy':
      return this.generateDuplicateHeavy(size, valueRange);
    default:
      return this.generateRandom(size, valueRange);
    }
  }

  generateWithTarget(options: InputGeneratorOptions & { target: number }): {
    array: number[];
    target: number;
  } {
    const array = this.generate(options);
    return { array, target: options.target };
  }

  private generateSorted(size: number, range: [number, number]): number[] {
    const result: number[] = [];
    let current = range[0];
    const step = Math.max(1, Math.floor((range[1] - range[0]) / size));
    for (let i = 0; i < size; i++) {
      result.push(current);
      current += step;
    }
    return result;
  }

  private generateReverseSorted(size: number, range: [number, number]): number[] {
    const sorted = this.generateSorted(size, range);
    return sorted.reverse();
  }

  private generateRandom(size: number, range: [number, number]): number[] {
    const result: number[] = [];
    for (let i = 0; i < size; i++) {
      result.push(this.range(range[0], range[1]));
    }
    return result;
  }

  private generateNearlySorted(size: number, range: [number, number]): number[] {
    const result = this.generateSorted(size, range);
    const swaps = Math.max(1, Math.floor(size * 0.1));
    for (let i = 0; i < swaps; i++) {
      const a = this.range(0, size - 1);
      const b = this.range(0, size - 1);
      [result[a], result[b]] = [result[b], result[a]];
    }
    return result;
  }

  private generateDuplicateHeavy(size: number, range: [number, number]): number[] {
    const result: number[] = [];
    const uniqueCount = Math.max(1, Math.floor(size * 0.3));
    const uniqueValues: number[] = [];
    for (let i = 0; i < uniqueCount; i++) {
      uniqueValues.push(this.range(range[0], range[1]));
    }
    for (let i = 0; i < size; i++) {
      result.push(uniqueValues[this.range(0, uniqueValues.length - 1)]);
    }
    return result;
  }
}

export const inputGenerator = new InputGenerator();