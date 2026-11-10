import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getAlgorithmById } from '../../../src/core/algorithms';
import { ComplexityAnalyzerPage } from '../../../src/webview/pages/ComplexityAnalyzerPage';
import { PerformanceLabPage } from '../../../src/webview/pages/PerformanceLabPage';
import { AlgorithmComparisonPage } from '../../../src/webview/pages/AlgorithmComparisonPage';
import { ComplexityGrowthChart } from '../../../src/webview/components/complexity/ComplexityGrowthChart';
import { GrowthChart } from '../../../src/webview/components/complexity/GrowthChart';
import { MeasuredOperationsChart } from '../../../src/webview/components/complexity/MeasuredOperationsChart';
import { LearningModuleView } from '../../../src/webview/components/complexity/LearningModuleView';
import { OperationMetricsDisplay } from '../../../src/webview/components/complexity/OperationMetrics';
import { SpaceAnalysisPanel } from '../../../src/webview/components/complexity/SpaceAnalysisPanel';
import { runInstrumentedInput } from '../../../src/core/complexity/counters/engine';

const bubbleSort = getAlgorithmById('bubble-sort')!;
const binarySearch = getAlgorithmById('binary-search')!;

const render = (element: JSX.Element): string => renderToStaticMarkup(element);

describe('Phase 4 webview pages render without errors', () => {
  it('renders the complexity analyzer for a sorting algorithm', () => {
    const markup = render(
      <ComplexityAnalyzerPage algorithm={bubbleSort} onBack={() => undefined} />
    );

    expect(markup).toContain('Bubble Sort');
    expect(markup.length).toBeGreaterThan(200);
  });

  it('renders the complexity analyzer for a searching algorithm', () => {
    const markup = render(
      <ComplexityAnalyzerPage algorithm={binarySearch} onBack={() => undefined} />
    );

    expect(markup).toContain('Binary Search');
  });

  it('renders the performance lab', () => {
    const markup = render(
      <PerformanceLabPage algorithm={bubbleSort} onBack={() => undefined} />
    );

    expect(markup.length).toBeGreaterThan(200);
  });

  it('renders the comparison page', () => {
    const markup = render(
      <AlgorithmComparisonPage algorithm={bubbleSort} onBack={() => undefined} />
    );

    expect(markup.length).toBeGreaterThan(200);
  });
});

describe('Phase 4 components render without errors', () => {
  it('renders the growth chart with a log scale option', () => {
    const markup = render(
      <GrowthChart
        series={[{ name: 'Bubble Sort', color: '#3b82f6', values: [1, 10, 100] }]}
        sampleSizes={[10, 20, 30]}
        logScale={false}
        onToggleLogScale={() => undefined}
        explanation="Test explanation"
      />
    );

    expect(markup.length).toBeGreaterThan(50);
  });

  it('renders the complexity growth chart', () => {
    const markup = render(<ComplexityGrowthChart />);
    expect(markup.length).toBeGreaterThan(50);
  });

  it('renders the measured operations chart with real counts', () => {
    const run = runInstrumentedInput('bubble-sort', { array: [5, 3, 8, 2, 1] });
    const markup = render(
      <MeasuredOperationsChart
        series={[{ name: 'Bubble Sort', counts: [run.metrics.comparisons] }]}
        sizes={[5]}
        counterName="comparisons"
      />
    );

    expect(markup.length).toBeGreaterThan(50);
  });

  it('renders the learning module', () => {
    const markup = render(<LearningModuleView />);
    expect(markup.length).toBeGreaterThan(200);
  });

  it('renders the operation metrics with the counting convention', () => {
    const run = runInstrumentedInput('bubble-sort', { array: [5, 3, 8, 2, 1] });
    const markup = render(
      <OperationMetricsDisplay metrics={run.metrics} title="Operations" />
    );

    expect(markup).toContain('Comparisons');
  });

  it('renders the space analysis panel', () => {
    const run = runInstrumentedInput('merge-sort', { array: [5, 3, 8, 2, 1] });
    const markup = render(
      <SpaceAnalysisPanel
        analysis={{
          algorithmId: 'merge-sort',
          inputSize: run.inputSize,
          theoreticalAuxiliary: 'O(n)',
          estimatedAuxiliaryBytes: 32,
          measuredAllocations: 8,
          measuredDeallocations: 4,
          measuredStackDepth: 4,
          measuredPeakBytes: 20,
          notes: 'test',
        }}
      />
    );

    expect(markup.length).toBeGreaterThan(50);
  });
});
