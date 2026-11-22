import type { FunctionComponent } from 'react';
import { Box, Flex, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { ComplexityCase, ComplexityDerivation as Derivation } from '../../../core/complexity/types';

interface ComplexityDerivationViewProps {
  /** The theoretical case being inspected (best/average/worst/space case object). */
  kase: ComplexityCase;
  caseTitle: string;
  pseudocode?: string[];
}

/**
 * Renders the derivation for a selected complexity value:
 * definition, explanation, step-by-step derivation, assumptions and the
 * pseudocode sections that determine the complexity.
 */
export const ComplexityDerivationView: FunctionComponent<ComplexityDerivationViewProps> = ({
  kase,
  caseTitle,
  pseudocode,
}) => {
  const derivation: Derivation = kase.derivation;

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      }}
    >
      <Flex align="center" gap={SPACING.md} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
        <Text as="h2" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: 0 }}>
          {caseTitle}
        </Text>
        <Box
          style={{
            backgroundColor: COLORS.accent + '22',
            color: COLORS.accent,
            border: `1px solid ${COLORS.accent}`,
            padding: '0.2rem 0.65rem',
            borderRadius: RADIUS.md,
            fontWeight: 600,
            fontSize: '0.95rem',
          }}
        >
          {kase.notation}
        </Box>
      </Flex>

      <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 1.6, margin: `${SPACING.md} 0 0 0` }}>
        {kase.explanation}
      </Text>

      <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: `${SPACING.md} 0 0.25rem 0` }}>
        Derivation
      </Text>
      <Box
        style={{
          backgroundColor: COLORS.surfaceElevated,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
          borderLeft: `3px solid ${COLORS.accent}`,
        }}
      >
        <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
          {derivation.explanation}
        </Text>
      </Box>

      {derivation.codeSections && derivation.codeSections.length > 0 && (
        <>
          <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: `${SPACING.md} 0 0.25rem 0` }}>
            Determining code sections
          </Text>
          <Box
            style={{
              backgroundColor: '#0f172a',
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              fontFamily: '"SF Mono", Menlo, monospace',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              overflowX: 'auto',
            }}
          >
            {derivation.codeSections.map((line, i) => {
              const numberMatch = line.match(/^\s*(\d+)\.\s*(.*)$/);
              const pseudoLine = numberMatch ? pseudocode?.[parseInt(numberMatch[1], 10)] : undefined;
              return (
                <Text
                  key={i}
                  as="div"
                  style={{ color: COLORS.textSecondary, margin: 0, whiteSpace: 'pre-wrap' } as React.CSSProperties}
                >
                  {line}
                  {pseudoLine && pseudoLine.trim().length > 0 && (
                    <span style={{ display: 'block', opacity: 0.7, paddingLeft: '1rem' }}>
                      pseudocode[ {pseudoLine.trim().slice(0, 80)} ]
                    </span>
                  )}
                </Text>
              );
            })}
          </Box>
        </>
      )}

      {derivation.assumptions && derivation.assumptions.length > 0 && (
        <>
          <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: `${SPACING.md} 0 0.25rem 0` }}>
            Assumptions
          </Text>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {derivation.assumptions.map((assumption, i) => (
              <li key={i} style={{ color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: '0.25rem' }}>
                {assumption}
              </li>
            ))}
          </ul>
        </>
      )}
    </Box>
  );
};
