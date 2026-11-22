import type { FunctionComponent } from 'react';
import { useMemo, useState } from 'react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';

export interface GrowthSeries {
  name: string;
  color: string;
  values: number[];
}

interface GrowthChartProps {
  /** Theoretical growth values for each of the sampled input sizes. */
  series: GrowthSeries[];
  sampleSizes: number[];
  logScale: boolean;
  onToggleLogScale?: (log: boolean) => void;
  title?: string;
  /** Caption explaining what the chart demonstrates. */
  explanation?: string;
  width?: number;
  height?: number;
}

const SERIES_COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#94a3b8'];

export const DEFAULT_SERIES_COLORS = SERIES_COLORS;

/**
 * Multi-series line chart for growth curves with a linear/log Y scale.
 * Theoretical curves are explicitly labelled as illustrative growth
 * functions, not measured operation counts.
 */
export const GrowthChart: FunctionComponent<GrowthChartProps> = ({
  series,
  sampleSizes,
  logScale,
  onToggleLogScale,
  title,
  explanation,
  width = 640,
  height = 320,
}) => {
  const [hovered, setHovered] = useState<{ series: number; point: number } | null>(null);

  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    const all = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v) && (logScale ? v > 1 : true));
    const xMin = sampleSizes.length > 0 ? sampleSizes[0] : 1;
    const xMax = sampleSizes.length > 1 ? sampleSizes[sampleSizes.length - 1] : Math.max(1, xMin + 1);
    const finiteValues = all.filter((v) => v > (logScale ? 1 : -Infinity) && Number.isFinite(v));
    const yMax = finiteValues.length ? Math.max(1, Math.max(...finiteValues)) : 1;
    const yMin = logScale ? Math.max(1, Math.min(...finiteValues, yMax)) : 0;
    return { xMin, xMax, yMin, yMax };
  }, [series, sampleSizes, logScale]);

  const margin = { top: 28, right: 30, bottom: 44, left: 66 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const scaleY = (v: number): number => {
    if (logScale) {
      const lv = Math.log2(Math.max(v, 1));
      const lo = Math.log2(Math.max(yMin, 1));
      const hi = Math.log2(Math.max(yMax, 2));
      return margin.top + plotH - ((lv - lo) / Math.max(hi - lo, 0.0001)) * plotH;
    }
    return margin.top + plotH - ((v - yMin) / Math.max(yMax - yMin, 0.0001)) * plotH;
  };

  const scaleX = (n: number): number => {
    const t = (n - xMin) / Math.max(xMax - xMin, 1);
    return margin.left + t * plotW;
  };

  const yTicks = useMemo(() => {
    if (!logScale) {
      const steps = 4;
      return Array.from({ length: steps + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / steps);
    }
    // powers of two between yMin and yMax
    const ticks: number[] = [];
    let power = Math.ceil(Math.log2(Math.max(yMin, 1)));
    const maxPower = Math.floor(Math.log2(Math.max(yMax, 2)));
    for (; power <= maxPower; power++) {
      ticks.push(Math.pow(2, power));
    }
    if (ticks.length === 0) {ticks.push(Math.max(1, yMin));}
    return ticks;
  }, [logScale, yMin, yMax]);

  const xTicks = useMemo(() => sampleSizes.filter((_, i) => i % Math.max(1, Math.ceil(sampleSizes.length / 8)) === 0), [sampleSizes]);

  if (series.length === 0 || sampleSizes.length < 2) {
    return (
      <div
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.md,
          padding: SPACING.lg,
          textAlign: 'center',
          color: COLORS.textMuted,
        }}
      >
        Select at least one growth curve and at least two input sizes to render the chart.
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: COLORS.surface, borderRadius: RADIUS.md }}>
      {(title || onToggleLogScale) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.sm,
            gap: SPACING.sm,
            flexWrap: 'wrap',
          }}
        >
          {title && <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: 0 }}>{title}</h3>}
          {onToggleLogScale && (
            <button
              onClick={() => onToggleLogScale(!logScale)}
              aria-pressed={logScale}
              style={{
                backgroundColor: logScale ? COLORS.accent : COLORS.surfaceElevated,
                color: COLORS.textPrimary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.sm,
                padding: '0.25rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              Logarithmic scale {logScale ? 'on' : 'off'}
            </button>
          )}
        </div>
      )}
      <svg width={width} height={height} role="img" aria-label={buildAriaLabel(series, sampleSizes)}>
        {/* axes */}
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotH} stroke={COLORS.textMuted} />
        <line x1={margin.left} y1={margin.top + plotH} x2={margin.left + plotW} y2={margin.top + plotH} stroke={COLORS.textMuted} />
        {/* axis titles */}
        <text x={margin.left} y={12} fill={COLORS.textMuted} fontSize={11}>
          y-scale: {logScale ? 'log₂' : 'linear'} · theoretical growth functions, not measured counts
        </text>
        <text x={margin.left + plotW} y={height - 8} textAnchor="end" fill={COLORS.textMuted} fontSize={11}>
          input size n
        </text>

        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={margin.left}
              y1={scaleY(tick)}
              x2={margin.left + plotW}
              y2={scaleY(tick)}
              stroke={COLORS.border}
              strokeDasharray="3 3"
              opacity={0.5}
            />
            <text x={margin.left - 8} y={scaleY(tick) + 4} textAnchor="end" fill={COLORS.textMuted} fontSize={11}>
              {formatTick(tick)}
            </text>
          </g>
        ))}

        {xTicks.map((tick) => (
          <g key={`x-${tick}`}>
            <line x1={scaleX(tick)} y1={margin.top + plotH} x2={scaleX(tick)} y2={margin.top + plotH + 4} stroke={COLORS.textMuted} />
            <text x={scaleX(tick)} y={margin.top + plotH + 18} textAnchor="middle" fill={COLORS.textMuted} fontSize={11}>
              {formatTick(tick)}
            </text>
          </g>
        ))}

        {series.map((s, si) => {
          const path = sampleSizes
            .map((n, pi) => `${pi === 0 ? 'M' : 'L'}${scaleX(n).toFixed(1)},${scaleY(s.values[pi]).toFixed(1)}`)
            .join(' ');
          return (
            <g key={s.name}>
              <path d={path} fill="none" stroke={s.color} strokeWidth={2.5} />
              {sampleSizes.map((n, pi) => (
                <circle
                  key={`${s.name}@${n}`}
                  cx={scaleX(n)}
                  cy={scaleY(s.values[pi])}
                  r={hovered && hovered.series === si && hovered.point === pi ? 5 : 3.5}
                  fill={s.color}
                  onMouseEnter={() => setHovered({ series: si, point: pi })}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <title>{`${s.name} at n = ${n}: ≈ ${formatTick(s.values[pi])} operations (illustrative growth value)`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      {hovered && (
        <div style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 4 }}>
          {series[hovered.series].name} at n = {sampleSizes[hovered.point]}: ≈ {formatTick(series[hovered.series].values[hovered.point])} (theoretical growth value, not a measured count)
        </div>
      )}
      {explanation && (
        <div style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, marginTop: SPACING.sm }}>{explanation}</div>
      )}
    </div>
  );
};

function formatTick(v: number): string {
  if (!Number.isFinite(v)) {return '—';}
  if (v >= 1_000_000) {return `${(v / 1_000_000).toFixed(1)}M`;}
  if (v >= 10_000) {return `${(v / 1_000).toFixed(1)}k`;}
  if (v >= 10 || Number.isInteger(v)) {return `${Math.round(v)}`;}
  return v.toPrecision(3);
}

function buildAriaLabel(series: GrowthSeries[], sampleSizes: number[]): string {
  const first = series[0];
  return `Growth chart of ${series.map((s) => s.name).join(', ')} over input sizes ${sampleSizes[0]} to ${
    sampleSizes[sampleSizes.length - 1]
  }. ${first.name} starts at ≈ ${formatTick(first.values[0])} and ends at ≈ ${formatTick(
    first.values[first.values.length - 1]
  )}.`;
}
