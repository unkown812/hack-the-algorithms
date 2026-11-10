import type { FunctionComponent } from 'react';
import type { ArrayState, VisualStateType } from '../../../core/visualization/types';

type Props = {
  array: ArrayState;
  barWidth?: number;
  barGap?: number;
  maxHeight?: number;
  showValues?: boolean;
  showIndices?: boolean;
};

const STATE_COLORS: Record<VisualStateType, string> = {
  default: '#334155',
  active: '#3b82f6',
  comparing: '#f59e0b',
  selected: '#3b82f6',
  swapping: '#ef4444',
  updated: '#22c55e',
  sorted: '#22c55e',
  found: '#22c55e',
  eliminated: '#94a3b8',
};

export const ArrayRenderer: FunctionComponent<Props> = ({
  array,
  barWidth = 28,
  barGap = 6,
  maxHeight = 220,
  showValues = true,
  showIndices = true,
}) => {
  const values = array.values;
  const maxVal = values.length > 0 ? Math.max(...values) : 1;
  const containerWidth = values.length * (barWidth + barGap) + barGap;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 8,
        minHeight: maxHeight + 120,
      }}
    >
      <svg
        width={containerWidth}
        height={maxHeight + 60}
        style={{ display: 'block', backgroundColor: '#0f172a', borderRadius: 6 }}
      >
        {values.map((value, index) => {
          const style = array.elementStyles[index];
          const state = style?.state ?? 'default';
          const color = STATE_COLORS[state] ?? STATE_COLORS.default;
          const barHeight = maxVal > 0 ? (value / maxVal) * maxHeight : 0;
          const x = index * (barWidth + barGap) + barGap;
          const y = maxHeight - barHeight + 30;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx={3}
                style={{ transition: 'fill 0.2s, height 0.2s' }}
              />
              {showValues && barHeight > 10 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize={10}
                  fontFamily="monospace"
                  fontWeight={600}
                >
                  {value}
                </text>
              )}
              {showIndices && (
                <text
                  x={x + barWidth / 2}
                  y={maxHeight + 55}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={11}
                  fontFamily="monospace"
                >
                  {index}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
