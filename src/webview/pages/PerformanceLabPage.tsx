import type { FunctionComponent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { Algorithm } from '../../core/algorithms';
import { InputSizeTester } from '../../core/complexity/input/InputSizeTester';
import type { TestDataset } from '../../core/complexity/input/InputSizeTester';
import { MAX_INPUT_LIMITS, INPUT_SIZE_PRESETS } from '../../core/complexity/benchmarking/BenchmarkConfig';
import { runInstrumentedInput, getConventionFor, isSearchingAlgorithm } from '../../core/complexity/counters/engine';
import type { InstrumentedRunResult, InstrumentedInput } from '../../core/complexity/counters/engine';
import { BenchmarkRunner } from '../../core/complexity/benchmarking/BenchmarkRunner';
import type { BenchmarkResult } from '../../core/complexity/types/BenchmarkResult';
import { ComplexityExplanationService } from '../../core/complexity/explanations/ComplexityExplanationService';
import { ComplexityReportGenerator } from '../../core/complexity/reports/ComplexityReportGenerator';
import type { ComplexityReport } from '../../core/complexity/reports/ComplexityReportGenerator';
import { ComplexityGrowthChart } from '../components/complexity/ComplexityGrowthChart';
import { MeasuredOperationsChart } from '../components/complexity/MeasuredOperationsChart';
import { OperationMetricsDisplay } from '../components/complexity/OperationMetrics';
import { BenchmarkResults } from '../components/complexity/BenchmarkResults';
import { ComplexityReportPreview } from '../components/complexity/ComplexityReportPreview';

type LabTab = 'input' | 'operations' | 'benchmark' | 'charts' | 'report';

interface SamplePoint {
  algorithmId: string;
  scenario: string;
  size: number;
  totalOperations: number;
  comparisons: number;
  timeMs: number;
}

interface PerformanceLabProps {
  algorithm: Algorithm;
  onBack: () => void;
}

const TABS: Array<{ id: LabTab; label: string }> = [
  { id: 'input', label: 'Input Configuration' },
  { id: 'operations', label: 'Operation Counts' },
  { id: 'benchmark', label: 'Benchmarking' },
  { id: 'charts', label: 'Growth Charts' },
  { id: 'report', label: 'Report' },
];

const explanationService = new ComplexityExplanationService();
const reportGenerator = new ComplexityReportGenerator();
const benchmarkRunner = new BenchmarkRunner();

export const PerformanceLabPage: FunctionComponent<PerformanceLabProps> = ({ algorithm, onBack }) => {
  const [tab, setTab] = useState<LabTab>('input');

  // ---- dataset state -------------------------------------------------------
  const [dataset, setDataset] = useState<TestDataset | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [datasetLabel, setDatasetLabel] = useState<string>('');

  // ---- counting state ------------------------------------------------------
  const [run, setRun] = useState<InstrumentedRunResult | null>(null);
  const [countError, setCountError] = useState<string | null>(null);
  const [samples, setSamples] = useState<Array<SamplePoint & { algorithmId: string }>>([]);

  // ---- benchmark state -----------------------------------------------------
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const maxLimit = MAX_INPUT_LIMITS[algorithm.id] ?? 10000;
  const isSearch = useMemo(() => isSearchingAlgorithm(algorithm.id), [algorithm.id]);
  const convention = useMemo(() => getConventionFor(algorithm.id), [algorithm.id]);

  const operationObservations = useMemo(() => {
    if (!run) {return [];}
    return explanationService.interpretOperations(algorithm.id, run.metrics, run.inputSize);
  }, [run, algorithm.id]);

  const benchmarkInterpretation = useMemo(() => {
    if (!benchmark) {return [];}
    return explanationService.interpretBenchmark(algorithm.id, benchmark);
  }, [benchmark, algorithm.id]);

  const report: ComplexityReport | null = useMemo(() => {
    if (samples.length === 0) {return null;}
    const latestSample = samples[samples.length - 1];
    const observations =
      samples.length > 1
        ? `Measured growth across ${samples.length} input sizes (${samples[0].size} → ${latestSample.size}). At n = ${latestSample.size} the last run counted ${latestSample.comparisons.toLocaleString()} comparisons and ${latestSample.totalOperations.toLocaleString()} total instrumented operations in ${latestSample.timeMs.toFixed(3)} ms. See the growth chart for the curve.`
        : run
          ? `At n = ${run.inputSize}, the instrumented run counted ${run.metrics.comparisons.toLocaleString()} comparisons and ${run.metrics.totalOperations.toLocaleString()} total operations. Add more input sizes to see the growth trend.`
          : undefined;
    return reportGenerator.generateReport(algorithm.id, {
      operationMetrics: benchmark?.operationMetrics ?? run?.metrics,
      benchmarkResults: benchmark ?? undefined,
      scenario: latestSample.scenario,
      observations,
    });
  }, [samples, benchmark, run, algorithm.id]);

  // ---- handlers ------------------------------------------------------------

  const buildDatasetFromConfig = (
    size: number,
    scenario: string,
    options: { seed?: number; valueRange?: [number, number]; customData?: number[] }
  ): void => {
    setDataError(null);
    if (!Number.isInteger(size) || size < 1) {
      setDataError('Input size must be a positive whole number (invalid input is never silently truncated).');
      return;
    }
    if (size > maxLimit) {
      setDataError(
        `Input size ${size.toLocaleString()} exceeds the safe limit of ${maxLimit.toLocaleString()} for ${algorithm.name} ` +
          `(expected complexity ${algorithm.timeComplexity.worst}). Reduce the size or use the presets.`
      );
      return;
    }
    if (options.customData) {
      if (options.customData.length === 0) {
        setDataError('Custom data must contain at least one valid number.');
        return;
      }
      if (options.customData.some((v) => !Number.isFinite(v))) {
        setDataError('Custom data contains a value that is not a finite number.');
        return;
      }
      if (options.customData.length > maxLimit) {
        setDataError(`Custom dataset has ${options.customData.length.toLocaleString()} elements; the safe limit is ${maxLimit.toLocaleString()}.`);
        return;
      }
    }

    try {
      const generated = new InputSizeTester().generateDataset(algorithm.id, size, scenario as TestDataset['scenario'], options);
      setDataset(generated);
      setDatasetLabel(
        `${algorithm.name} · n = ${generated.size.toLocaleString()} · scenario “${scenario}”${generated.target !== undefined ? ` · target = ${generated.target}` : ''}`
      );
      // any previous per-size results are invalidated by a new dataset family
      setRun(null);
      setBenchmark(null);
      setSamples([]);
      setCountError(null);
      setBenchmarkError(null);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to generate dataset');
    }
  };

  const runCounting = (): void => {
    if (!dataset) {
      setCountError('Generate a dataset first (Input Configuration tab).');
      window.setTimeout(() => setCountError(null), 4000);
      return;
    }
    setCountError(null);
    try {
      const input: InstrumentedInput = { array: dataset.array, target: dataset.target, scenario: dataset.scenario };
      const started = performance.now();
      const result = runInstrumentedInput(algorithm.id, input);
      const elapsed = performance.now() - started;
      setRun(result);
      setSamples((prev) => [
        ...prev.filter((s) => !(s.algorithmId === algorithm.id && s.scenario === dataset.scenario && s.size === dataset.size)),
        {
          algorithmId: algorithm.id,
          scenario: dataset.scenario,
          size: dataset.size,
          totalOperations: result.metrics.totalOperations,
          comparisons: result.metrics.comparisons,
          timeMs: elapsed,
        },
      ].sort((a, b) => a.size - b.size));
    } catch (err) {
      setRun(null);
      setCountError(err instanceof Error ? err.message : 'Operation counting failed');
    }
  };

  const runBenchmark = async (trials: number, warmupRuns: number): Promise<void> => {
    if (!dataset) {
      setBenchmarkError('Generate a dataset first (Input Configuration tab).');
      window.setTimeout(() => setBenchmarkError(null), 4000);
      return;
    }
    setBenchmarkError(null);
    setIsBenchmarking(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const input: InstrumentedInput = { array: dataset.array, target: dataset.target, scenario: dataset.scenario };
      const result = await benchmarkRunner.run({
        algorithmId: algorithm.id,
        input,
        scenario: dataset.scenario,
        trials,
        warmupRuns,
        timeoutMs: 30000,
        signal: controller.signal,
      });
      setBenchmark(result);
    } catch (err) {
      setBenchmark(null);
      setBenchmarkError(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      setIsBenchmarking(false);
      abortRef.current = null;
    }
  };

  const cancelBenchmark = (): void => {
    abortRef.current?.abort();
  };

  const preview =
    dataset
      ? dataset.array.slice(0, 16).join(', ') + (dataset.array.length > 16 ? ', …' : '')
      : '';
  const sampleSizes = [...new Set(samples.map((s) => s.size))].sort((a, b) => a - b);
  const sampleSeries = [
    {
      name: `${algorithm.name} (measured)`,
      counts: sampleSizes.map((size) => {
        const point = samples.find((s) => s.size === size);
        return point ? point.comparisons : 1;
      }),
    },
  ];

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
          ← Back to Algorithm Detail
        </Button>
      </Box>

      <Box
        style={{
          padding: SPACING.lg,
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.lg,
          marginBottom: SPACING.lg,
        }}
      >
        <Text as="h1" style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}>
          Performance Lab: {algorithm.name}
        </Text>
        <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: '0.5rem 0 0 0' }}>
          Test how {algorithm.name} behaves as the input grows. Counting runs are deterministic and instrumented; benchmarks
          repeat timed trials on the identical dataset. Timings describe the instrumented TypeScript execution, not native C.
        </Text>
      </Box>

      <Flex gap={SPACING.md} style={{ marginBottom: SPACING.lg, flexWrap: 'wrap' } as React.CSSProperties}>
        {TABS.map((t) => (
          <Button key={t.id} variant={tab === t.id ? 'primary' : 'ghost'} onClick={() => setTab(t.id)} size="sm">
            {t.label}
          </Button>
        ))}
      </Flex>

      {datasetLabel && (
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.accent, margin: `0 0 ${SPACING.md} 0`, fontWeight: 600 }}>
          Active dataset — {datasetLabel}
        </Text>
      )}

      {tab === 'input' && (
        <InputConfigPanel
          algorithmId={algorithm.id}
          maxLimit={maxLimit}
          isSearch={isSearch}
          dataset={dataset}
          preview={preview}
          error={dataError}
          onGenerate={buildDatasetFromConfig}
        />
      )}

      {tab === 'operations' && (
        <Box style={{ display: 'grid', gap: SPACING.lg }}>
          {countError && <ErrorBanner message={countError} />}
          <Flex gap={SPACING.md} align="center" style={{ flexWrap: 'wrap' } as React.CSSProperties}>
            <Button variant="primary" onClick={runCounting}>
              {run ? 'Re-run Operation Count' : 'Run Operation Count'}
            </Button>
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
              Counts every comparison, swap, write, read, loop step, recursion and allocation for the active dataset.
            </Text>
          </Flex>
          {run && (
            <OperationMetricsDisplay metrics={run.metrics} convention={convention} />
          )}
          {run && (
            <Box
              style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.lg,
                padding: SPACING.lg,
              }}
            >
              <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
                What this run tells you
              </Text>
              {operationObservations.map((obs, i) => (
                <Box
                  key={i}
                  style={{
                    borderLeft: `3px solid ${COLORS.accent}`,
                    borderRadius: RADIUS.sm,
                    padding: SPACING.sm,
                    marginBottom: SPACING.sm,
                    backgroundColor: COLORS.surfaceElevated,
                  }}
                >
                  <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0, lineHeight: 1.55 }}>
                    {obs}
                  </Text>
                </Box>
              ))}
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: `${SPACING.sm} 0 0 0` }}>
                Run several input sizes — every counted run is stored in the growth chart on the “Growth Charts” tab.
              </Text>
            </Box>
          )}
        </Box>
      )}

      {tab === 'benchmark' && (
        <Box style={{ display: 'grid', gap: SPACING.lg }}>
          {benchmarkError && <ErrorBanner message={benchmarkError} />}
          <Flex gap={SPACING.lg} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
            <Box style={{ flex: 1, minWidth: 300 }}>
              <BenchmarkControlsWithDataset
                onRun={runBenchmark}
                onCancel={cancelBenchmark}
                disabled={!dataset}
                isRunning={isBenchmarking}
              />
            </Box>
            <Box style={{ flex: 1, minWidth: 320 }}>
              <BenchmarkResults result={benchmark} isRunning={isBenchmarking} />
              {benchmark && (
                <Box
                  style={{
                    marginTop: SPACING.md,
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: RADIUS.md,
                    padding: SPACING.md,
                  }}
                >
                  {benchmarkInterpretation.map((line, i) => (
                    <Text key={i} as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0.35rem 0', lineHeight: 1.55 }}>
                      • {line}
                    </Text>
                  ))}
                </Box>
              )}
            </Box>
          </Flex>
          <Box
            style={{
              backgroundColor: COLORS.surfaceElevated,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
            }}
          >
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0, lineHeight: 1.55 }}>
              <strong>METHODOLOGY</strong> — dataset generated once and reused unchanged (instrumented runs never mutate the
              input) · {isBenchmarking ? 'warm-up runs in progress' : `${benchmark?.warmupRuns ?? 0} warm-up run(s) precede measured trials`} ·
              timings via the runtime's monotonic high-resolution clock · output of every trial is validity-checked ·
              results summarised with min/median/mean/max/σ. Execution time depends on hardware, JIT state and system load —
              compare algorithms only within the same session on the same dataset.
            </Text>
          </Box>
        </Box>
      )}

      {tab === 'charts' && (
        <Box style={{ display: 'grid', gap: SPACING.lg }}>
          <Box
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
            }}
          >
            <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
              Measured Operation Growth Overlay
            </Text>
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.75rem 0' }}>
              Every “Run Operation Count” from the Operation Counts tab contributes a point here. These are real counted
              operations, not theoretical curves.
            </Text>
            <MeasuredOperationsChart series={sampleSeries} sizes={sampleSizes} />
          </Box>

          <ComplexityGrowthChart title="Theoretical Growth Classes (illustrative)" />
        </Box>
      )}

      {tab === 'report' && <ComplexityReportPreview report={report} />}
    </Box>
  );
};

const InputConfigPanel: FunctionComponent<{
  algorithmId: string;
  maxLimit: number;
  isSearch: boolean;
  dataset: TestDataset | null;
  preview: string;
  error: string | null;
  onGenerate: (size: number, scenario: string, options: { seed?: number; valueRange?: [number, number]; customData?: number[] }) => void;
}> = ({ algorithmId, maxLimit, isSearch, dataset, preview, error, onGenerate }) => {
  const [size, setSize] = useState('100');
  const [scenario, setScenario] = useState(isSearch ? 'random-target' : 'random-order');
  const [seed, setSeed] = useState('12345');
  const [customData, setCustomData] = useState('');

  const scenarios = isSearch
    ? ['target-beginning', 'target-middle', 'target-end', 'target-not-found', 'random-target']
    : ['already-sorted', 'reverse-sorted', 'random-order', 'nearly-sorted', 'duplicate-heavy', 'custom'];

  const resolvedSize = (() => {
    const parsed = parseInt(size, 10);
    return Number.isFinite(parsed) ? parsed : NaN;
  })();

  const sizeTooLarge = Number.isFinite(resolvedSize) && resolvedSize > maxLimit;
  const sizeInvalid = !Number.isFinite(resolvedSize) || resolvedSize < 1;

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      }}
    >
      <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.25rem 0' }}>
        Input Size Testing Laboratory
      </Text>
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 1rem 0' }}>
        Seedable generation keeps experiments reproducible. Sizes above {maxLimit.toLocaleString()} are rejected —
        {algorithmId.includes('search') ? ' search scales almost linearly so large inputs are fine.' : ' O(n²) inputs beyond this limit would dominate battery and memory.'}
      </Text>

      <Flex gap={SPACING.lg} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
        <Box style={{ flex: '1 1 320px' }}>
          <Label> preset sizes </Label>
          <Flex gap={SPACING.sm} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
            {INPUT_SIZE_PRESETS.map((preset) => (
              <Button
                key={preset}
                variant={resolvedSize === preset ? 'primary' : 'ghost'}
                size="sm"
                disabled={preset > maxLimit}
                onClick={() => setSize(String(preset))}
                style={{ opacity: preset > maxLimit ? 0.5 : 1 }}
              >
                {preset.toLocaleString()}
              </Button>
            ))}
          </Flex>
          <Box style={{ marginTop: SPACING.md }}>
            <Label> custom size (1 – {maxLimit.toLocaleString()}) </Label>
            <input
              type="number"
              value={size}
              min={1}
              max={maxLimit}
              onChange={(e) => setSize(e.target.value)}
              style={inputStyle}
            />
            {sizeInvalid && <Warn>Enter a whole number of at least 1.</Warn>}
            {!sizeInvalid && sizeTooLarge && (
              <Warn>No silent truncation: reduce the size below {maxLimit.toLocaleString()} or pick a preset.</Warn>
            )}
          </Box>
          <Box style={{ marginTop: SPACING.md }}>
            <Label> value range (min − max) </Label>
            <input type="text" value="1 − 1000" disabled readOnly style={{ ...inputStyle, opacity: 0.6 }} />
          </Box>
        </Box>

        <Box style={{ flex: '1 1 240px' }}>
          <Label> input scenario </Label>
          <select value={scenario} onChange={(e) => setScenario(e.target.value)} style={selectStyle}>
            {scenarios.map((s) => (
              <option key={s} value={s}>
                {LABELS[s] ?? s}
              </option>
            ))}
          </select>
          <Box style={{ marginTop: SPACING.md }}>
            <Label> random seed </Label>
            <input type="number" value={seed} min={1} onChange={(e) => setSeed(e.target.value)} style={inputStyle} />
            <Warn>Same seed + size + scenario ⇒ identical dataset.</Warn>
          </Box>
          {!isSearch && (
            <Box style={{ marginTop: SPACING.md }}>
              <Label> custom input (comma-separated; overrides generation) </Label>
              <input
                type="text"
                placeholder="e.g. 5,3,8,2,1"
                value={customData}
                onChange={(e) => setCustomData(e.target.value)}
                style={{ ...inputStyle, fontFamily: 'monospace' }}
              />
            </Box>
          )}
        </Box>
      </Flex>

      {error && (
        <Box
          role="alert"
          style={{
            marginTop: SPACING.md,
            backgroundColor: COLORS.error + '22',
            border: `1px solid ${COLORS.error}`,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
          }}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0 }}>
            {error}
          </Text>
        </Box>
      )}

      {dataset && preview && (
        <Box style={{ marginTop: SPACING.md }}>
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
            Dataset head: {preview}
          </Text>
        </Box>
      )}

      <Flex justify="flex-end" style={{ marginTop: SPACING.lg } as React.CSSProperties}>
        <Button
          variant="primary"
          onClick={() =>
            onGenerate(resolvedSize, scenario, {
              seed: parseInt(seed, 10) || undefined,
              valueRange: [1, 1000],
              customData:
                !isSearch && customData.trim()
                  ? customData
                    .split(',')
                    .map((t) => parseInt(t.trim(), 10))
                    .filter((v) => Number.isFinite(v))
                  : undefined,
            })
          }
          disabled={sizeInvalid}
        >
          Generate Dataset
        </Button>
      </Flex>
    </Box>
  );
};

const BenchmarkControlsWithDataset: FunctionComponent<{
  onRun: (trials: number, warmupRuns: number) => void;
  onCancel: () => void;
  disabled: boolean;
  isRunning: boolean;
}> = ({ onRun, onCancel, disabled, isRunning }) => {
  const [trials, setTrials] = useState('5');
  const [warmup, setWarmup] = useState('2');

  const trialsNum = Math.max(1, Math.min(20, parseInt(trials, 10) || 1));
  const warmupNum = Math.max(0, Math.min(10, parseInt(warmup, 10) || 0));

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      }}
    >
      <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.25rem 0' }}>
        Benchmark Controls
      </Text>
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 1rem 0' }}>
        {disabled ? 'Generate a dataset first.' : 'Measures the instrumented execution with warm-ups and repeatable trials.'}
      </Text>
      <Flex gap={SPACING.lg} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
        <Box>
          <Label> trials (1–20) </Label>
          <input type="number" min={1} max={20} value={trials} onChange={(e) => setTrials(e.target.value)} disabled={disabled || isRunning} style={inputStyle} />
        </Box>
        <Box>
          <Label> warm-up runs (0–10) </Label>
          <input type="number" min={0} max={10} value={warmup} onChange={(e) => setWarmup(e.target.value)} disabled={disabled || isRunning} style={inputStyle} />
        </Box>
      </Flex>
      <Flex gap={SPACING.md} justify="flex-end" style={{ marginTop: SPACING.lg } as React.CSSProperties}>
        {isRunning && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button variant="primary" onClick={() => onRun(trialsNum, warmupNum)} disabled={disabled || isRunning}>
          {isRunning ? 'Running…' : 'Run Benchmark'}
        </Button>
      </Flex>
    </Box>
  );
};

function ErrorBanner({ message }: { message: string }) {
  return (
    <Box
      role="alert"
      style={{
        backgroundColor: COLORS.error + '22',
        border: `1px solid ${COLORS.error}`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
      }}
    >
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0 }}>
        {message}
      </Text>
    </Box>
  );
}

const Label: FunctionComponent<{ children: React.ReactNode }> = ({ children }) => (
  <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.5rem 0' }}>
    {children}
  </Text>
);

const Warn: FunctionComponent<{ children: React.ReactNode }> = ({ children }) => (
  <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.warning, margin: '0.4rem 0 0 0', lineHeight: 1.45 }}>
    {children}
  </Text>
);

const LABELS: Record<string, string> = {
  'target-beginning': 'Target at Beginning',
  'target-middle': 'Target at Middle',
  'target-end': 'Target at End',
  'target-not-found': 'Target Not Found',
  'random-target': 'Random Target',
  'already-sorted': 'Already Sorted',
  'reverse-sorted': 'Reverse Sorted',
  'random-order': 'Random Order',
  'nearly-sorted': 'Nearly Sorted',
  'duplicate-heavy': 'Duplicate Heavy',
  custom: 'Custom Input',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 160,
  padding: '0.375rem 0.5rem',
  backgroundColor: COLORS.surfaceElevated,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.md,
  color: COLORS.textPrimary,
  fontSize: '0.875rem',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.375rem 0.5rem',
  backgroundColor: COLORS.surfaceElevated,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.md,
  color: COLORS.textPrimary,
  fontSize: '0.875rem',
};
