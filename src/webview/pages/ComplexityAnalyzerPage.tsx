import type { FunctionComponent } from 'react';
import { useMemo, useState } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { Algorithm } from '../../core/algorithms';
import { InputSizeTester as InputSizeTesterCore } from '../../core/complexity/input/InputSizeTester';
import type { TestDataset } from '../../core/complexity/input/InputSizeTester';
import { ComplexitySummary } from '../components/complexity/ComplexitySummary';
import { ComplexityDerivationView } from '../components/complexity/ComplexityDerivation';
import { OperationMetricsDisplay } from '../components/complexity/OperationMetrics';
import { SpaceAnalysisPanel } from '../components/complexity/SpaceAnalysisPanel';
import { LearningModuleView } from '../components/complexity/LearningModuleView';
import { ComplexityExplanationService } from '../../core/complexity/explanations/ComplexityExplanationService';
import { runInstrumentedInput, getConventionFor } from '../../core/complexity/counters/engine';
import { SpaceAnalyzer } from '../../core/complexity/space/SpaceAnalyzer';
import type { InstrumentedRunResult } from '../../core/complexity/counters/engine';

type AnalysisTab = 'theory' | 'operations' | 'space' | 'learn';
type ComplexityKey = 'best' | 'average' | 'worst' | 'space';

interface ComplexityAnalyzerProps {
  algorithm: Algorithm;
  onBack: () => void;
  onCompare?: (algo: Algorithm) => void;
}

const TABS: Array<{ id: AnalysisTab; label: string }> = [
  { id: 'theory', label: 'Theory & Derivation' },
  { id: 'operations', label: 'Operation Counts' },
  { id: 'space', label: 'Space Analysis' },
  { id: 'learn', label: 'Learn Complexity' },
];

const explanationService = new ComplexityExplanationService();
const spaceAnalyzer = new SpaceAnalyzer();

export const ComplexityAnalyzerPage: FunctionComponent<ComplexityAnalyzerProps> = ({
  algorithm,
  onBack,
  onCompare,
}) => {
  const [tab, setTab] = useState<AnalysisTab>('theory');
  const [selectedCase, setSelectedCase] = useState<ComplexityKey | null>(null);
  const [run, setRun] = useState<InstrumentedRunResult | null>(null);
  const [datasetMeta, setDatasetMeta] = useState<TestDataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convention = useMemo(() => getConventionFor(algorithm.id), [algorithm.id]);
  const detailed = algorithm.detailedComplexity;

  const selectedComplexityCase = useMemo(() => {
    if (!detailed) {return undefined;}
    switch (selectedCase) {
    case 'best': return detailed.best;
    case 'average': return detailed.average;
    case 'worst': return detailed.worst;
    case 'space': return {
      notation: detailed.space.auxiliary.notation,
      explanation: detailed.space.auxiliary.explanation,
      derivation: detailed.space.auxiliary.derivation,
    };
    default: return undefined;
    }
  }, [detailed, selectedCase]);

  const caseTitle = useMemo(() => {
    switch (selectedCase) {
    case 'best': return 'Best Case — Derivation';
    case 'average': return 'Average Case — Derivation';
    case 'worst': return 'Worst Case — Derivation';
    case 'space': return 'Space Complexity — Derivation';
    default: return '';
    }
  }, [selectedCase]);

  const observations = useMemo(() => {
    if (!run) {return [];}
    return explanationService.interpretOperations(algorithm.id, run.metrics, run.inputSize);
  }, [run, algorithm.id]);

  const spaceAnalysis = useMemo(() => {
    if (!run) {return null;}
    return spaceAnalyzer.analyzeRun(algorithm.id, run);
  }, [run, algorithm.id]);

  const handleRunExperiment = (dataset: TestDataset): void => {
    setError(null);
    try {
      const input = { array: dataset.array, target: dataset.target, scenario: dataset.scenario };
      const result = runInstrumentedInput(algorithm.id, input);
      setRun(result);
      setDatasetMeta(dataset);
    } catch (err) {
      setRun(null);
      setDatasetMeta(null);
      setError(err instanceof Error ? err.message : 'Experiment failed unexpectedly');
    }
  };

  const handleComplexityClick = (key: string): void => {
    if (key === 'best' || key === 'average' || key === 'worst' || key === 'space') {
      if (!detailed) {
        setError('No reviewed derivation is stored for this algorithm yet.');
        window.setTimeout(() => setError(null), 4000);
        return;
      }
      setSelectedCase(key as ComplexityKey);
    }
  };

  const preview = datasetMeta
    ? datasetMeta.array.slice(0, 12).join(', ') + (datasetMeta.array.length > 12 ? ', …' : '')
    : null;

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
      <Flex justify="between" align="start" style={{ flexWrap: 'wrap', gap: SPACING.md } as React.CSSProperties}>
        <Box>
          <Text as="h1" style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}>
            Complexity Analysis: {algorithm.name}
          </Text>
          <Flex gap={SPACING.md} style={{ marginTop: SPACING.sm, flexWrap: 'wrap' } as React.CSSProperties}>
            <Chip>{algorithm.category}</Chip>
            <Chip color="#fef3c7" textColor="#92400e">{algorithm.difficulty}</Chip>
            <Chip>{algorithm.timeComplexity.worst} worst case</Chip>
            <Chip>{algorithm.spaceComplexity.auxiliary} auxiliary space</Chip>
          </Flex>
        </Box>
        <Flex gap={SPACING.sm} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
          {onCompare && (
            <Button variant="secondary" onClick={() => onCompare(algorithm)}>
              Compare Algorithms
            </Button>
          )}
          <Button variant="ghost" onClick={onBack}>
            ← Back to Algorithm Detail
          </Button>
        </Flex>
      </Flex>

      <Flex gap={SPACING.sm} style={{ marginTop: SPACING.xl, flexWrap: 'wrap' } as React.CSSProperties}>
        {TABS.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </Flex>

      {error && (
        <Box
          style={{
            marginTop: SPACING.md,
            backgroundColor: COLORS.error + '22',
            border: `1px solid ${COLORS.error}`,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
          }}
          role="alert"
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0 }}>
            {error}
          </Text>
        </Box>
      )}

      {tab === 'theory' && (
        <Box style={{ marginTop: SPACING.lg }}>
          <ComplexitySummary
            best={algorithm.timeComplexity.best}
            average={algorithm.timeComplexity.average}
            worst={algorithm.timeComplexity.worst}
            auxiliarySpace={algorithm.spaceComplexity.auxiliary}
            totalSpace={algorithm.spaceComplexity.total}
            onComplexityClick={handleComplexityClick}
          />
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: `${SPACING.sm} 0 0 0` }}>
            Click any complexity value to open its derivation below.
          </Text>

          {selectedComplexityCase && selectedCase && (
            <Box style={{ marginTop: SPACING.lg } as React.CSSProperties}>
              <ComplexityDerivationView kase={selectedComplexityCase} caseTitle={caseTitle} pseudocode={algorithm.pseudocode} />
            </Box>
          )}
        </Box>
      )}

      {tab === 'operations' && (
        <Box style={{ marginTop: SPACING.lg }}>
          <ExperimentControls algorithmId={algorithm.id} onRun={handleRunExperiment} />

          {run && (
            <Box style={{ marginTop: SPACING.lg } as React.CSSProperties}>
              <OperationMetricsDisplay metrics={run.metrics} convention={convention} />

              {datasetMeta && datasetMeta.target !== undefined && (
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: `${SPACING.md} 0 0 0` }}>
                  Target {datasetMeta.target} — {run.foundIndex !== undefined && run.foundIndex >= 0
                    ? `found at index ${run.foundIndex} (output index verified)`
                    : 'not present in the dataset'}. Output validity: {run.outputValid ? 'PASSED' : 'FAILED'}.
                </Text>
              )}
              {datasetMeta && datasetMeta.target === undefined && (
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: `${SPACING.md} 0 0 0` }}>
                  Input ({run.inputSize.toLocaleString()} elements): {preview}
                  <br />
                  Output validity: {run.outputValid ? 'PASSED (sorted, multiset preserved)' : 'FAILED'} — every counted run is verified against the algorithm's contract.
                </Text>
              )}

              <Box style={{ marginTop: SPACING.lg } as React.CSSProperties}>
                <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
                  What this run tells you
                </Text>
                {observations.map((obs, i) => (
                  <Box
                    key={i}
                    style={{
                      backgroundColor: COLORS.surface,
                      borderLeft: `3px solid ${COLORS.accent}`,
                      borderRadius: RADIUS.sm,
                      padding: SPACING.sm,
                      marginBottom: SPACING.sm,
                    }}
                  >
                    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0, lineHeight: 1.55 }}>
                      {obs}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {tab === 'space' && (
        <Box style={{ marginTop: SPACING.lg }}>
          <SpaceAnalysisPanel analysis={spaceAnalysis} />
        </Box>
      )}

      {tab === 'learn' && (
        <Box style={{ marginTop: SPACING.lg }}>
          <LearningModuleView />
        </Box>
      )}
    </Box>
  );
};

function ExperimentControls({
  algorithmId,
  onRun,
}: {
  algorithmId: string;
  onRun: (dataset: TestDataset) => void;
}) {
  const tester = useMemo(() => new InputSizeTesterCore(), []);
  const [size, setSize] = useState(50);
  const [scenario, setScenario] = useState<string>(defaultScenario(algorithmId));
  const [seed, setSeed] = useState('12345');

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
        Input Size Testing
      </Text>
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 1rem 0' }}>
        Deterministic, seeded generation — the same seed with the same size and scenario always reproduces the same
        dataset, so operation counts are reproducible.
      </Text>

      <Flex gap={SPACING.lg} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
        <Box style={{ flex: '1 1 320px' }}>
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.5rem 0' }}>
            Input size (elements)
          </Text>
          <Flex gap={SPACING.sm} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
            {SIZE_PRESETS.map((preset) => (
              <Button
                key={preset}
                variant={size === preset ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSize(preset)}
              >
                {preset.toLocaleString()}
              </Button>
            ))}
          </Flex>
        </Box>

        <Box style={{ flex: '1 1 220px' }}>
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.5rem 0' }}>
            Input scenario
          </Text>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            style={selectStyle}
          >
            {tester.getSupportedScenarios(algorithmId).map((s) => (
              <option key={s} value={s}>
                {SCENARIO_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </Box>

        <Box style={{ flex: '1 1 160px' }}>
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.5rem 0' }}>
            Random seed
          </Text>
          <input
            type="number"
            value={seed}
            min={1}
            onChange={(e) => setSeed(e.target.value)}
            style={inputStyle}
          />
        </Box>
      </Flex>

      <Flex justify="flex-end" style={{ marginTop: SPACING.lg } as React.CSSProperties}>
        <Button
          variant="primary"
          onClick={() => {
            const parsedSeed = parseInt(seed, 10);
            const options = {
              seed: Number.isFinite(parsedSeed) ? parsedSeed : undefined,
              valueRange: [1, 1000] as [number, number],
            };
            onRun(tester.generateDataset(algorithmId, size, scenario as never, options));
          }}
        >
          Run Operation Count
        </Button>
      </Flex>
    </Box>
  );
}

export const SIZE_PRESETS = [10, 25, 50, 100, 250, 500];

export const SCENARIO_LABELS: Record<string, string> = {
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
};

function defaultScenario(algorithmId: string): string {
  return algorithmId.includes('search') ? 'random-target' : 'random-order';
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.375rem 0.5rem',
  backgroundColor: COLORS.surfaceElevated,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.md,
  color: COLORS.textPrimary,
  fontSize: '0.875rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.375rem 0.5rem',
  backgroundColor: COLORS.surfaceElevated,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.md,
  color: COLORS.textPrimary,
  fontSize: '0.875rem',
};

function Chip({ children, color, textColor }: { children: React.ReactNode; color?: string; textColor?: string }) {
  return (
    <Box
      style={{
        backgroundColor: color ?? COLORS.surfaceElevated,
        color: textColor ?? COLORS.textSecondary,
        padding: '0.25rem 0.75rem',
        borderRadius: RADIUS.md,
        fontSize: '0.85rem',
        fontWeight: 500,
      } as React.CSSProperties}
    >
      {children}
    </Box>
  );
}

// (InputSizeTester here is the core input-lab service, deliberately named with
// a Core suffix to distinguish it from the sibling webview UI component.)
