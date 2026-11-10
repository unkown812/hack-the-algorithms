import type { FunctionComponent } from 'react';
import { Box, Text } from './primitives';
import { COLORS, SPACING, RADIUS } from './Theme';

type Props = {
  label: string;
  value: string | number;
  subtitle?: string;
};

export const StatCard: FunctionComponent<Props> = ({
  label,
  value,
  subtitle,
}) => {
  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      } as React.CSSProperties}
    >
      <Text
        as="p"
        style={{
          fontSize: '0.875rem',
          lineHeight: '1.5',
          color: COLORS.textMuted,
          margin: 0,
        } as React.CSSProperties}
      >
        {label}
      </Text>
      <Text
        as="h2"
        style={{
          fontSize: '1.875rem',
          fontWeight: 700,
          lineHeight: '1.25',
          color: COLORS.textPrimary,
          margin: '0.5rem 0 0 0',
        } as React.CSSProperties}
      >
        {value}
      </Text>
      {subtitle && (
        <Text
          as="p"
          style={{
            fontSize: '0.875rem',
            lineHeight: '1.5',
            color: COLORS.accent,
            margin: '0.25rem 0 0 0',
            fontWeight: 500,
          } as React.CSSProperties}
        >
          {subtitle}
        </Text>
      )}
    </Box>
  );
};
