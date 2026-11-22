import type { FunctionComponent } from 'react';
import { Box, Flex, Text } from './primitives';
import { COLORS, SPACING, RADIUS } from './Theme';

type Props = {
  id: string;
  name: string;
  description: string;
  algorithmCount: number;
  onClick: () => void;
};

export const CategoryCard: FunctionComponent<Props> = ({
  name,
  description,
  algorithmCount,
  onClick,
}) => {
  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        cursor: 'pointer',
      } as unknown as React.CSSProperties}
      onClick={onClick}
    >
      <Flex justify="between" align="start">
        <Box>
          <Text
            as="h3"
            style={{ ...{ fontSize: '1.5rem', fontWeight: 600, lineHeight: '1.33' }, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}
          >
            {name}
          </Text>
          <Text
            as="p"
            style={{
              fontSize: '0.875rem',
              lineHeight: '1.5',
              color: COLORS.textSecondary,
              margin: '0.5rem 0 0 0',
            } as React.CSSProperties}
          >
            {description}
          </Text>
        </Box>
        <Box
          style={{
            backgroundColor: COLORS.accent + '15',
            color: COLORS.accent,
            padding: '0.5rem 0.875rem',
            borderRadius: RADIUS.md,
            fontSize: '0.875rem',
            fontWeight: 600,
          } as React.CSSProperties}
        >
          {algorithmCount}
        </Box>
      </Flex>
    </Box>
  );
};
