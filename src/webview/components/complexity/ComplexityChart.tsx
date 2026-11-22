import type { FunctionComponent } from 'react';
import { COLORS, SPACING, TYPOGRAPHY } from '../Theme';

interface ComplexityChartProps {
  data: Array<{ name: string; value: number; theoretical?: number }>;
  width?: number;
  height?: number;
  title?: string;
  /** Value suffix shown next to hovered bars (e.g. "ops"). */
  unit?: string;
}

/**
 * Compact horizontal bar chart for measured values; does not attempt to
 * display theoretical curves (use GrowthChart for multi-series growth data).
 */
export const ComplexityChart: FunctionComponent<ComplexityChartProps> = ({
  data,
  width = 600,
  height = 300,
  title,
  unit = '',
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          padding: SPACING.md,
          textAlign: 'center',
          color: COLORS.textMuted,
        }}
      >
        No data to display
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.value, 1)));
  const labelWidth = 0; // horizontal layout keeps rows self-labelling
  const rowHeight = Math.max(28, Math.min(48, (height - 60) / Math.max(1, data.length)));
  const chartWidth = width - 140 - labelWidth;
  const chartHeight = data.length * rowHeight;

  const totalHeight = chartHeight + (title ? 34 : 0) + 24;

  return (
    <div
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: SPACING.md,
        overflowX: 'auto',
      }}
    >
      {title && (
        <h3
          style={{
            ...TYPOGRAPHY.h3,
            color: COLORS.textPrimary,
            margin: '0 0 1rem 0',
          }}
        >
          {title}
        </h3>
      )}
      <svg
        width={width}
        height={totalHeight}
        style={{ display: 'block' }}
        role="img"
        aria-label={
          title ??
          `Bar chart with ${data.length} rows: ${data.map((d) => `${d.name} ${d.value}`).join(', ')}`
        }
      >
        <g transform={title ? 'translate(8, 34)' : 'translate(8, 0)'}>
          {data.map((d, i) => {
            const y = i * rowHeight;
            const barHeight = rowHeight - 10;
            const barWidth = Math.max(2, (d.value / maxValue) * chartWidth);
            const displayValue = formatValue(d.value);
            return (
              <g key={`${d.name}-${i}`}>
                <text x={0} y={y + barHeight / 2 + 4} fill={COLORS.textSecondary} fontSize={12}>
                  {d.name}
                </text>
                <rect
                  x={130}
                  y={y + 5}
                  width={chartWidth}
                  height={barHeight}
                  fill={COLORS.surfaceElevated}
                  rx={3}
                  opacity={0.35}
                />
                <rect
                  x={130}
                  y={y + 5}
                  width={barWidth}
                  height={barHeight}
                  fill={COLORS.accent}
                  rx={3}
                >
                  <title>{`${d.name}: ${displayValue}${unit ? ' ' + unit : ''}`}</title>
                </rect>
                <text
                  x={130 + Math.max(barWidth + 6, 8)}
                  y={y + barHeight / 2 + 4}
                  fill={COLORS.textPrimary}
                  fontSize={12}
                >
                  {displayValue}
                </text>
              </g>
            );
          })}
          {/* baseline axis */}
          <line
            x1={130}
            y1={0}
            x2={130}
            y2={chartHeight}
            stroke={COLORS.border}
            strokeWidth={1}
          />
        </g>
      </svg>
    </div>
  );
};

function formatValue(value: number): string {
  if (!Number.isFinite(value)) {return '—';}
  if (Math.abs(value) >= 1_000_000) {return `${(value / 1_000_000).toFixed(1)}M`;}
  if (Math.abs(value) >= 10_000) {return `${(value / 1_000).toFixed(1)}k`;}
  if (Math.abs(value) >= 1) {return value.toLocaleString();}
  return value.toPrecision(3);
}
