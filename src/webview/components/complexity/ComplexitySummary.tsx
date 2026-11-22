import type { FunctionComponent } from 'react';
import { Box, Flex, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';

interface ComplexitySummaryProps {
  best: string;
  average: string;
  worst: string;
  auxiliarySpace: string;
  totalSpace?: string;
  onComplexityClick?: (type: string) => void;
}

export const ComplexitySummary: FunctionComponent<ComplexitySummaryProps> = ({
  best,
  average,
  worst,
  auxiliarySpace,
  totalSpace,
  onComplexityClick,
}) => {
  const ComplexityItem: FunctionComponent<{
    label: string;
    value: string;
    onClick?: () => void;
  }> = ({ label, value, onClick }) => (
    <Box
      style={{
        backgroundColor: COLORS.surfaceElevated,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        flex: 1,
        minWidth: 100,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.backgroundColor = COLORS.surface;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.backgroundColor = COLORS.surfaceElevated;
        }
      }}
      onClick={onClick}
    >
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' }}>
        {label}
      </Text>
      <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.accent, fontWeight: 600, margin: 0 }}>
        {value}
      </Text>
    </Box>
  );

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      }}
    >
      <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 1rem 0' }}>
        Complexity Summary
      </Text>

      <Flex gap={SPACING.md} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
        <ComplexityItem label="Best Case" value={best} onClick={() => onComplexityClick?.('best')} />
        <ComplexityItem label="Average Case" value={average} onClick={() => onComplexityClick?.('average')} />
        <ComplexityItem label="Worst Case" value={worst} onClick={() => onComplexityClick?.('worst')} />
      </Flex>

      <Flex gap={SPACING.md} style={{ marginTop: SPACING.md, flexWrap: 'wrap' } as React.CSSProperties}>
        <ComplexityItem label="Auxiliary Space" value={auxiliarySpace} />
        {totalSpace && <ComplexityItem label="Total Space" value={totalSpace} />}
      </Flex>
    </Box>
  );
};