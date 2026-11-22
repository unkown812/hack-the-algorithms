import type { FunctionComponent } from 'react';
import { useMemo, useState } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { Algorithm } from '../../core/algorithms';
import { getAlgorithmsByCategory, getAlgorithmById } from '../../core/algorithms/registry';
import { InputSizeTester } from '../../core/complexity/input/InputSizeTester';
import { ComparisonService } from '../../core/complexity/comparison/ComparisonService';
import { MAX_INPUT_LIMITS, INPUT_SIZE_PRESETS } from '../../core/complexity/benchmarking/BenchmarkConfig';
import type { ComparisonResult } from '../../core/complexity/types/ComparisonResult';
import { ComparisonResultsTable } from '../components/complexity/ComparisonResultsTable';
import { ComplexityChart } from '../components/complexity/ComplexityChart';

interface AlgorithmComparisonProps {
  algorithm: Algorithm;
  onBack: () => void;
}

const comparisonService = new ComparisonService();

export const AlgorithmComparisonPage: FunctionComponent<AlgorithmComparisonProps> = ({ algorithm, onBack }) => {
  const category = algorithm.category;
  const isSearching = category.toLowerCase() === 'searching';
  const peers = useMemo(() => getAlgorithmsByCategory(category), [category]);
  const maxLimit = Math.min(
    ...peers.map((a) => MAX_INPUT_LIMITS[a.id] ?? 10000)
  );

  const [selected, setSelected] = useState<string[]>([algorithm.id]);
  const [size, setSize] = useState(100);
  const [scenario, setScenario] = useState(isSearching ? 'random-target' : 'random-order');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenarios = isSearching
    ? ['target-beginning', 'target-middle', 'target-end', 'target-not-found', 'random-target']
    : ['already-sorted', 'reverse-sorted', 'random-order', 'nearly-sorted', 'duplicate-heavy'];

  const togglePeer = (id: string): void => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        // keep at least one selected (the page's primary algorithm)
        if (id === algorithm.id) {return prev;}
        return prev.filter((p) => p !== id);
      }
      return [...prev, id];
    });
  };

  const handleCompare = async (): Promise<void> => {
    setError(null);
    if (selected.length < 1) {
      setError('Select at least one algorithm.');
      return;
    }
    if (!Number.isInteger(size) || size < 1 || size > maxLimit) {
      setError(`Input size must be a whole number between 1 and ${maxLimit.toLocaleString()} (the safe limit across all selected algorithms).`);
      return;
    }
    setIsRunning(true);
    try {
      const dataset = new InputSizeTester().generateDataset(
        algorithm.id,
        size,
        scenario as Parameters<InputSizeTester['generateDataset']>[2],
        { seed: 12345, valueRange: [1, 1000] }
      );
      const input =
        dataset.target !== undefined
          ? { array: dataset.array, target: dataset.target, scenario: dataset.scenario }
          : { array: dataset.array, scenario: dataset.scenario };
      const comparison = await comparisonService.runComparison({
        algorithmIds: selected,
        input,
        scenario,
        trials: 5,
        warmupRuns: 2,
      });
      setResult(comparison);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setIsRunning(false);
    }
  };

  const comparabilityNote = result || selected.length > 1
    ? comparisonService.getComparabilityNote(selected)
    : 'Select two or more algorithms from the same problem family to compare. Mixed-category comparisons are reported per algorithm only.';

  const chartData = result
    ? result.algorithms.map((entry) => ({
      name: entry.algorithmName,
      value: entry.operationMetrics.totalOperations,
    }))
    : [];
  const comparisonChart: Array<{ name: string; value: number }> = chartData;

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
          Algorithm Comparison Laboratory
        </Text>
        <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: '0.5rem 0 0 0' }}>
          Category: {category} · every selected algorithm runs on the identical dataset and each result is validated
          against the problem contract before being shown.
        </Text>
      </Box>

      <Box
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          marginBottom: SPACING.lg,
        }}
      >
        <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
          Comparison Configuration
        </Text>

        <Flex gap={SPACING.lg} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
          <Box style={{ flex: '1 1 320px' }}>
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.5rem 0' }}>
              Algorithms to compare ({category} family)
            </Text>
            <Flex gap={SPACING.sm} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
              {peers.map((peer: Algorithm) => {
                const id = peer.id;
                const isActive = selected.includes(id);
                const isPrimary = id === algorithm.id;
                return (
                  <Button
                    key={id}
                    variant={isActive ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => togglePeer(id)}
                    disabled={selected.length <= 1 && isActive}
                    title={getAlgorithmById(id)?.timeComplexity.worst}
                  >
                    {peer.name}
                    {isPrimary ? ' ★' : ''}
                  </Button>
                );
              })}
            </Flex>
          </Box>

          <Box style={{ flex: '1 1 180px' }}>
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.5rem 0' }}>
              Input size (max {maxLimit.toLocaleString()})
            </Text>
            <Flex gap={SPACING.sm} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
              {INPUT_SIZE_PRESETS.filter((s) => s <= maxLimit).map((preset) => (
                <Button key={preset} variant={size === preset ? 'primary' : 'ghost'} size="sm" onClick={() => setSize(preset)}>
                  {preset.toLocaleString()}
                </Button>
              ))}
            </Flex>
            <input
              type="number"
              value={size}
              min={1}
              max={maxLimit}
              onChange={(e) => setSize(parseInt(e.target.value, 10))}
              style={{
                marginTop: SPACING.sm,
                width: 140,
                padding: '0.375rem 0.5rem',
                backgroundColor: COLORS.surfaceElevated,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.md,
                color: COLORS.textPrimary,
                fontSize: '0.875rem',
              }}
            />
          </Box>

          <Box style={{ flex: '1 1 200px' }}>
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.5rem 0' }}>
              Input scenario
            </Text>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              style={{
                width: '100%',
                padding: '0.375rem 0.5rem',
                backgroundColor: COLORS.surfaceElevated,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.md,
                color: COLORS.textPrimary,
                fontSize: '0.875rem',
              }}
            >
              {scenarios.map((s) => (
                <option key={s} value={s}>
                  {SCENARIO_LABELS[s] ?? s}
                </option>
              ))}
            </select>
          </Box>
        </Flex>

        <Box
          style={{
            marginTop: SPACING.md,
            backgroundColor: COLORS.surfaceElevated,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
          }}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0, lineHeight: 1.55 }}>
            {comparabilityNote}
          </Text>
        </Box>

        <Flex justify="flex-end" style={{ marginTop: SPACING.lg } as React.CSSProperties}>
          <Button variant="primary" onClick={handleCompare} disabled={isRunning}>
            {isRunning ? 'Running comparison…' : 'Run Comparison'}
          </Button>
        </Flex>
      </Box>

      {error && (
        <Box
          role="alert"
          style={{
            marginBottom: SPACING.md,
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

      {result && (
        <Box style={{ display: 'grid', gap: SPACING.lg }}>
          {result.outputsEquivalent === false && (
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
                WARNING: the sorted outputs of the compared algorithms are NOT equivalent — do not trust these results;
                this indicates an implementation problem, not a fair comparison.
              </Text>
            </Box>
          )}
          {result.outputsEquivalent === true && (
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.success, margin: 0 }}>
              ✓ Output validation passed: every algorithm produced an equivalent, correctly sorted result for the dataset.
            </Text>
          )}

          <ComparisonResultsTable result={result} primaryAlgorithmId={algorithm.id} />

          <Box
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
            }}
          >
            <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
              Total Instrumented Operations
            </Text>
            <ComparisonChart data={comparisonChart} />
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0.75rem 0 0 0', lineHeight: 1.55 }}>
              Bars show the totalOperations counter per algorithm on the same dataset. Counter composition matters: fewer
              swaps does not automatically mean fewer comparisons (insertion sort shifts writes instead of swapping), and
              execution time does not scale with the counter alone — constant factors differ per operation type.
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

/**
 * Horizontal bar chart pinned to the shared ComplexityChart renderer.
 */
function ComparisonChart({ data }: { data: Array<{ name: string; value: number }> }) {
  if (data.length === 0) {
    return (
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
        No results yet — run a comparison first.
      </Text>
    );
  }
  return <ComplexityChart data={data} title={undefined} unit="ops" width={700} />;
}

const SCENARIO_LABELS: Record<string, string> = {
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
