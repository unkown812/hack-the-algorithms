import type { FunctionComponent } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../components/Theme';
import type { Algorithm } from '../../core/algorithms';

type Props = {
  algorithm: Algorithm | undefined;
  onBack: () => void;
  onVisualize?: (algo: Algorithm) => void;
  onAnalyze?: (algo: Algorithm) => void;
  onPerformanceLab?: (algo: Algorithm) => void;
  onCompare?: (algo: Algorithm) => void;
  onCodePlayground?: (algo: Algorithm) => void;
};

export const AlgorithmDetail: FunctionComponent<Props> = ({
  algorithm,
  onBack,
  onVisualize,
  onAnalyze,
  onPerformanceLab,
  onCompare,
  onCodePlayground,
}) => {
  if (!algorithm) {
    return (
      <Box
        style={{
          padding: SPACING['2xl'],
          maxWidth: 1200,
          margin: '0 auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: COLORS.textPrimary,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        } as React.CSSProperties}
      >
        <Text as="h1" style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}>
          Algorithm Not Found
        </Text>
        <Button variant="ghost" onClick={onBack} style={{ marginTop: SPACING.lg } as React.CSSProperties}>
          ← Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box
      style={{
        padding: SPACING['2xl'],
        maxWidth: 1200,
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: COLORS.textPrimary,
      } as React.CSSProperties}
    >
      <Box style={{ marginBottom: SPACING.lg }}>
        <Button variant="ghost" onClick={onBack}>
          ← Back to Library
        </Button>
      </Box>

      <Box style={{ marginBottom: SPACING.xl }}>
        <Flex justify="between" align="start">
          <Box>
            <Text
              as="h1"
              style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}
            >
              {algorithm.name}
            </Text>
            <Flex gap={SPACING.md} style={{ marginTop: SPACING.sm, flexWrap: 'wrap' } as React.CSSProperties}>
              <Box
                style={{
                  backgroundColor: COLORS.surfaceElevated,
                  color: COLORS.textSecondary,
                  padding: '0.25rem 0.75rem',
                  borderRadius: RADIUS.md,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                } as React.CSSProperties}
              >
                {algorithm.category}
              </Box>
              <Box
                style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '0.25rem 0.75rem',
                  borderRadius: RADIUS.md,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                } as React.CSSProperties}
              >
                {algorithm.difficulty}
              </Box>
              {onVisualize && (
                <Button
                  variant="primary"
                  onClick={() => onVisualize(algorithm as Algorithm)}
                  style={{ marginLeft: 'auto' } as React.CSSProperties}
                >
                  Visualize Algorithm
                </Button>
              )}
              {onAnalyze && (
                <Button
                  variant="secondary"
                  onClick={() => onAnalyze(algorithm as Algorithm)}
                  style={{ marginLeft: '8px' } as React.CSSProperties}
                >
                  Analyze Complexity
                </Button>
              )}
              {onPerformanceLab && (
                <Button
                  variant="secondary"
                  onClick={() => onPerformanceLab(algorithm as Algorithm)}
                  style={{ marginLeft: '8px' } as React.CSSProperties}
                >
                  Performance Lab
                </Button>
              )}
              {onCompare && (
                <Button
                  variant="secondary"
                  onClick={() => onCompare(algorithm as Algorithm)}
                  style={{ marginLeft: '8px' } as React.CSSProperties}
                >
                  Compare Algorithms
                </Button>
              )}
              {onCodePlayground && (
                <Button
                  variant="secondary"
                  onClick={() => onCodePlayground(algorithm as Algorithm)}
                  style={{ marginLeft: '8px' } as React.CSSProperties}
                >
                  Code Playground
                </Button>
              )}
            </Flex>
          </Box>
          <Box
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              minWidth: 140,
              textAlign: 'center',
            } as React.CSSProperties}
          >
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 } as React.CSSProperties}>
              Time Complexity
            </Text>
            <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, margin: '0.25rem 0 0 0', fontWeight: 600 } as React.CSSProperties}>
              {algorithm.timeComplexity.worst}
            </Text>
          </Box>
        </Flex>
      </Box>

      <Flex gap={SPACING.xl} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
        <Box style={{ flex: '1 1 600px', minWidth: 300 } as React.CSSProperties}>
          <Text
            as="h2"
            style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: '0 0 1rem 0' } as React.CSSProperties}
          >
            Description
          </Text>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 1.7, margin: 0 } as React.CSSProperties}
          >
            {algorithm.description}
          </Text>

          <Text
            as="h2"
            style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: '2rem 0 1rem 0' } as React.CSSProperties}
          >
            Problem Statement
          </Text>
          <Box
            style={{
              backgroundColor: COLORS.surface,
              borderLeft: `3px solid ${COLORS.accent}`,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
            } as React.CSSProperties}
          >
            <Text
              as="p"
              style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 1.7, margin: 0 } as React.CSSProperties}
            >
              {algorithm.problemStatement}
            </Text>
          </Box>

          <Text
            as="h2"
            style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: '2rem 0 1rem 0' } as React.CSSProperties}
          >
            Approach
          </Text>
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 1.7, margin: 0 } as React.CSSProperties}
          >
            {algorithm.approach}
          </Text>

          <Text
            as="h2"
            style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: '2rem 0 1rem 0' } as React.CSSProperties}
          >
            Pseudocode
          </Text>
          <Box
            style={{
              backgroundColor: '#0f172a',
              borderRadius: RADIUS.md,
              padding: SPACING.lg,
              fontFamily: '"SF Mono", "Menlo", monospace',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              overflowX: 'auto',
            } as React.CSSProperties}
          >
            {algorithm.pseudocode.map((line: string, i: number) => (
              <Text
                key={i}
                as="div"
                style={{ color: COLORS.textSecondary, margin: 0, whiteSpace: 'pre-wrap' } as React.CSSProperties}
              >
                {line}
              </Text>
            ))}
          </Box>
        </Box>

        <Box style={{ flex: '1 1 350px', minWidth: 300 } as React.CSSProperties}>
          <Text
            as="h2"
            style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: '0 0 1rem 0' } as React.CSSProperties}
          >
            Complexity Analysis
          </Text>

          <Box
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
            } as React.CSSProperties}
          >
            <Flex justify="between" style={{ marginBottom: SPACING.md } as React.CSSProperties}>
              <Text as="span" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary } as React.CSSProperties}>
                Best
              </Text>
              <Text as="span" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600 } as React.CSSProperties}>
                {algorithm.timeComplexity.best}
              </Text>
            </Flex>
            <Flex justify="between" style={{ marginBottom: SPACING.md } as React.CSSProperties}>
              <Text as="span" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary } as React.CSSProperties}>
                Average
              </Text>
              <Text as="span" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600 } as React.CSSProperties}>
                {algorithm.timeComplexity.average}
              </Text>
            </Flex>
            <Flex justify="between" style={{ marginBottom: SPACING.md } as React.CSSProperties}>
              <Text as="span" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary } as React.CSSProperties}>
                Worst
              </Text>
              <Text as="span" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600 } as React.CSSProperties}>
                {algorithm.timeComplexity.worst}
              </Text>
            </Flex>
            <Flex justify="between" style={{ marginBottom: SPACING.md } as React.CSSProperties}>
              <Text as="span" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary } as React.CSSProperties}>
                Auxiliary Space
              </Text>
              <Text as="span" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600 } as React.CSSProperties}>
                {algorithm.spaceComplexity.auxiliary}
              </Text>
            </Flex>
            {algorithm.spaceComplexity.total && (
              <Flex justify="between">
                <Text as="span" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary } as React.CSSProperties}>
                  Total Space
                </Text>
                <Text as="span" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: 600 } as React.CSSProperties}>
                  {algorithm.spaceComplexity.total}
                </Text>
              </Flex>
            )}
          </Box>

          <Box style={{ marginTop: SPACING.lg } as React.CSSProperties}>
            <Text
              as="h2"
              style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: '0 0 1rem 0' } as React.CSSProperties}
            >
              Theory
            </Text>
            <Text
              as="p"
              style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 1.7, margin: 0 } as React.CSSProperties}
            >
              {algorithm.theory}
            </Text>
          </Box>

          {algorithm.useCases.length > 0 && (
            <Box style={{ marginTop: SPACING.lg } as React.CSSProperties}>
              <Text
                as="h2"
                style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: '0 0 1rem 0' } as React.CSSProperties}
              >
                Use Cases
              </Text>
              <Flex gap={SPACING.sm} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
                {algorithm.useCases.map((uc: string) => (
                  <Box
                    key={uc}
                    style={{
                      backgroundColor: COLORS.surfaceElevated,
                      color: COLORS.textSecondary,
                      padding: '0.25rem 0.75rem',
                      borderRadius: RADIUS.md,
                      fontSize: '0.875rem',
                    } as React.CSSProperties}
                  >
                    {uc}
                  </Box>
                ))}
              </Flex>
            </Box>
          )}

          {algorithm.relatedAlgorithms.length > 0 && (
            <Box style={{ marginTop: SPACING.lg } as React.CSSProperties}>
              <Text
                as="h2"
                style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: '0 0 1rem 0' } as React.CSSProperties}
              >
                Related Algorithms
              </Text>
              <Text
                as="p"
                style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 } as React.CSSProperties}
              >
                {algorithm.relatedAlgorithms.join(', ')}
              </Text>
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
};
