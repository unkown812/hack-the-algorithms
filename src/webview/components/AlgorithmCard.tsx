import type { FunctionComponent } from 'react';
import type { Algorithm } from '../../core/algorithms';
import { Box, Flex, Text } from './primitives';
import { COLORS, SPACING, RADIUS } from './Theme';

type Props = {
  algorithm: Algorithm;
  onSelect: (id: string) => void;
};

export const AlgorithmCard: FunctionComponent<Props> = ({
  algorithm,
  onSelect,
}) => {
  const difficultyColors: Record<string, string> = {
    Beginner: COLORS.success,
    Intermediate: COLORS.warning,
    Advanced: COLORS.error,
  };
  const diffColor = difficultyColors[algorithm.difficulty] || COLORS.textMuted;

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        cursor: 'pointer',
        ':hover': {
          borderColor: COLORS.accent,
        },
      } as unknown as React.CSSProperties}
      onClick={() => onSelect(algorithm.id)}
    >
      <Flex direction="column" gap={SPACING.sm}>
        <Flex justify="between" align="start">
          <Text
            as="h3"
            style={{ ...{ fontSize: '1.5rem', fontWeight: 600, lineHeight: '1.33' }, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}
          >
            {algorithm.name}
          </Text>
          <Box
            style={{
              backgroundColor: diffColor + '20',
              color: diffColor,
              padding: '0.25rem 0.625rem',
              borderRadius: RADIUS.sm,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            } as React.CSSProperties}
          >
            {algorithm.difficulty}
          </Box>
        </Flex>
        <Text
          as="p"
          style={{
            fontSize: '0.875rem',
            lineHeight: '1.5',
            color: COLORS.textSecondary,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}
        >
          {algorithm.description}
        </Text>
        <Box
          style={{
            display: 'flex',
            gap: SPACING.sm,
            marginTop: SPACING.md,
          } as React.CSSProperties}
        >
          {algorithm.tags.slice(0, 3).map((tag: string) => (
            <Box
              key={tag}
              style={{
                backgroundColor: COLORS.surfaceElevated,
                color: COLORS.textMuted,
                padding: '0.25rem 0.625rem',
                borderRadius: RADIUS.sm,
                fontSize: '0.75rem',
                fontWeight: 500,
              } as React.CSSProperties}
            >
              {tag}
            </Box>
          ))}
        </Box>
      </Flex>
    </Box>
  );
};
