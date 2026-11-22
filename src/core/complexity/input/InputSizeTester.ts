import { InputGenerator, InputScenario } from './InputGenerator';

export interface TestDataset {
  array: number[];
  target?: number;
  size: number;
  scenario: InputScenario;
}

export class InputSizeTester {
  generateDataset(
    algorithmId: string,
    size: number,
    scenario: InputScenario,
    options: {
      seed?: number;
      valueRange?: [number, number];
      customData?: number[];
      target?: number;
    } = {}
  ): TestDataset {
    const dataset: TestDataset = {
      array: [],
      size,
      scenario,
    };

    if (algorithmId.includes('search')) {
      // Fresh, seedable generator so identical options reproduce identical data.
      const seeded = new InputGenerator(options.seed ?? 12345);
      const sortedArray = seeded.generate({
        size,
        scenario: 'already-sorted',
        valueRange: options.valueRange ?? [1, 1000],
        customData: options.customData,
      });

      let target: number;
      switch (scenario) {
      case 'target-beginning':
        target = sortedArray[0] ?? 1;
        break;
      case 'target-middle':
        target = sortedArray[Math.floor(sortedArray.length / 2)] ?? 1;
        break;
      case 'target-end':
        target = sortedArray[sortedArray.length - 1] ?? 1;
        break;
      case 'target-not-found': {
        const max = sortedArray.length ? Math.max(...sortedArray) : 0;
        target = max + 1000;
        break;
      }
      case 'duplicate-target':
        target = sortedArray[Math.floor(sortedArray.length / 2)] ?? 1;
        break;
      case 'random-target': {
        const [min, max] = options.valueRange ?? [1, 1000];
        target = seeded.range(min, max);
        break;
      }
      default:
        target = options.target ?? (sortedArray[Math.floor(sortedArray.length / 2)] ?? 1);
      }

      if (options.target !== undefined && scenario !== 'target-not-found' && scenario !== 'random-target') {
        target = options.target;
      }

      dataset.array = sortedArray;
      dataset.target = target;
    } else {
      const seeded = new InputGenerator(options.seed ?? 12345);
      dataset.array = seeded.generate({
        size,
        scenario,
        valueRange: options.valueRange ?? [1, 1000],
        customData: options.customData,
      });
    }

    return dataset;
  }

  generateMultiple(
    algorithmId: string,
    sizes: number[],
    scenario: InputScenario,
    options?: { seed?: number; valueRange?: [number, number] }
  ): TestDataset[] {
    return sizes.map((size) =>
      this.generateDataset(algorithmId, size, scenario, options)
    );
  }

  getSupportedScenarios(algorithmId: string): InputScenario[] {
    if (algorithmId.includes('search')) {
      return [
        'target-beginning',
        'target-middle',
        'target-end',
        'target-not-found',
        'random-target',
      ];
    }
    return [
      'already-sorted',
      'reverse-sorted',
      'random-order',
      'nearly-sorted',
      'duplicate-heavy',
      'custom',
    ];
  }
}