import type { FunctionComponent } from 'react';
import { useMemo, useState } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import { COMPLEXITY_CLASSES } from '../../../core/complexity/analyzer/ComplexityNormalizer';
import { DEFAULT_SERIES_COLORS, GrowthChart } from './GrowthChart';

const CURVES = COMPLEXITY_CLASSES.filter((c) => c.name !== 'O(2ⁿ)' && c.name !== 'O(n!)');

interface ComplexityGrowthChartProps {
  title?: string;
  /** Curves preselected when the component mounts. */
  initialSelection?: string[];
  maxSampleSize?: number;
}

/**
 * Interactive complexity growth visualiser: pick up to three complexity
 * classes and observe how their growth differs as input size increases.
 */
export const ComplexityGrowthChart: FunctionComponent<ComplexityGrowthChartProps> = ({
  title = 'Complexity Growth Comparison',
  initialSelection = ['O(n)', 'O(n²)'],
  maxSampleSize = 4096,
}) => {
  const [selected, setSelected] = useState<string[]>(initialSelection.slice(0, 3));
  const [logScale, setLogScale] = useState(false);
  const [maxN, setMaxN] = useState(maxSampleSize);

  const sampleSizes = useMemo(() => {
    const sizes: number[] = [];
    const bounds = [4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
    for (const b of bounds) {
      if (b <= maxN) {sizes.push(b);}
    }
    if (sizes[sizes.length - 1] !== maxN) {sizes.push(maxN);}
    return sizes;
  }, [maxN]);

  const comparisonExplanation = useMemo(() => {
    if (selected.length !== 2) {
      return selected.length === 1
        ? `Only ${selected[0]} selected — select a second curve to compare relative growth.`
        : 'Select two complexity classes to see how fast one overtakes the other as n grows.';
    }
    const [a, b] = selected;
    const classA = CURVES.find((c) => c.name === a);
    const classB = CURVES.find((c) => c.name === b);
    if (!classA || !classB) {return '';}
    const ratio = (n: number): string => {
      const va = Math.max(1, classA.growthRate(n));
      const vb = Math.max(1, classB.growthRate(n));
      const hi = Math.max(va, vb);
      const lo = Math.min(va, vb);
      return `${hi / lo >= 100 ? Math.round(hi / lo).toLocaleString() : (hi / lo).toFixed(1)}×`;
    };
    const at512 = ratio(512);
    const dominant = compareComplexityOrder(a, b);
    return `At n = 512, ${dominant.fastName} already needs about ${at512} more work units than ${dominant.slowName}. Doubling n doubles ${dominant.fastName}'s relative disadvantage — this widening gap is what the class difference (${dominant.fastName} grows strictly faster) means asymptotically.`;
  }, [selected]);

  const toggleSelection = (name: string): void => {
    setSelected((prev) => {
      if (prev.includes(name)) {return prev.filter((s) => s !== name);}
      const next = [...prev, name];
      return next.slice(Math.max(0, next.length - 3));
    });
  };

  const series = selected.map((name, index) => {
    const cls = CURVES.find((c) => c.name === name);
    return {
      name,
      color: cls?.color ?? DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length],
      values: sampleSizes.map((n) => (cls ? Math.max(1, cls.growthRate(n)) : 1)),
    };
  });

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
        {title}
      </Text>
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 1rem 0' }}>
        Compare up to three complexity classes. Curves are normalised growth functions f(n) — they illustrate shape, not exact operation counts. Toggle the logarithmic scale to separate fast-growing curves.
      </Text>

      <Flex gap={SPACING.sm} style={{ flexWrap: 'wrap', marginBottom: SPACING.md } as React.CSSProperties}>
        {CURVES.map((curve) => (
          <Button
            key={curve.name}
            variant={selected.includes(curve.name) ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => toggleSelection(curve.name)}
            style={{
              borderColor: curve.color ?? COLORS.border,
              color: selected.includes(curve.name) ? COLORS.textPrimary : curve.color ?? COLORS.textPrimary,
            }}
          >
            {curve.name}
          </Button>
        ))}
      </Flex>

      <Flex gap={SPACING.lg} align="center" style={{ flexWrap: 'wrap', marginBottom: SPACING.md } as React.CSSProperties}>
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0 }}>
          Largest input size on the chart:
        </Text>
        {CURVE_SIZES.map((size) => (
          <Button key={size} variant={maxN === size ? 'primary' : 'ghost'} size="sm" onClick={() => setMaxN(size)}>
            n ≤ {size.toLocaleString()}
          </Button>
        ))}
      </Flex>

      <GrowthChart
        series={series}
        sampleSizes={sampleSizes}
        logScale={logScale}
        onToggleLogScale={setLogScale}
        title={undefined}
        explanation={comparisonExplanation}
      />

      <Box
        style={{
          marginTop: SPACING.md,
          backgroundColor: COLORS.surfaceElevated,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
        }}
      >
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0, lineHeight: 1.6 }}>
          Theoretical growth curves are illustrative: they show how a class grows with input
          size, not the exact operations of a specific algorithm. Operation-count overlays for real algorithms live in the
          Performance Lab charts, where measured counts come from the instrumented engine.
        </Text>
      </Box>
    </Box>
  );
};

const CURVE_SIZES = [64, 256, 1024, 4096];

function compareComplexityOrder(a: string, b: string): { fastName: string; slowName: string } {
  // CURVES follows the COMPLEXITY_CLASSES order (const … factorial). The
  // higher-order class is the slower algorithm but the "faster-growing" curve.
  const order = CURVES.map((c) => c.name);
  const idxA = order.indexOf(a);
  const idxB = order.indexOf(b);
  return {
    slowName: idxA > idxB ? a : b,
    fastName: idxA > idxB ? b : a,
  };
}
