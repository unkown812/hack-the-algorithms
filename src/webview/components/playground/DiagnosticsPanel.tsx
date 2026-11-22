import type { FunctionComponent } from 'react';
import { Box, Flex, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import { describeCategory } from '../../../core/compiler/CompilerDiagnostics';
import type { CompileDiagnostic } from '../../../core/playground/types';

interface DiagnosticsPanelProps {
  diagnostics: CompileDiagnostic[];
  /** Called when the student selects a diagnostic. */
  onSelect?: (diagnostic: CompileDiagnostic) => void;
  /** Line that is currently highlighted in the editor. */
  activeLine?: number;
}

/**
 * Lists the compiler diagnostics with a beginner friendly explanation.
 * Selecting a diagnostic reports the position so the editor can jump to it.
 */
export const DiagnosticsPanel: FunctionComponent<DiagnosticsPanelProps> = ({
  diagnostics,
  onSelect,
  activeLine,
}) => {
  if (diagnostics.length === 0) {
    return (
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
        No compiler diagnostics. Compile the program to see the compiler output here.
      </Text>
    );
  }

  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;

  return (
    <Box>
      <Flex gap={SPACING.sm} align="center" style={{ marginBottom: SPACING.sm } as React.CSSProperties}>
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: errorCount > 0 ? COLORS.error : COLORS.success, margin: 0, fontWeight: 600 }}>
          {errorCount} error{errorCount === 1 ? '' : 's'}
        </Text>
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.warning, margin: 0, fontWeight: 600 }}>
          {warningCount} warning{warningCount === 1 ? '' : 's'}
        </Text>
      </Flex>

      <Box style={{ display: 'grid', gap: SPACING.sm }}>
        {diagnostics.map((diagnostic) => {
          const isError = diagnostic.severity === 'error';
          const isActive = activeLine === diagnostic.line && diagnostic.line > 0;

          return (
            <Box
              key={diagnostic.id}
              onClick={() => onSelect?.(diagnostic)}
              style={{
                cursor: onSelect ? 'pointer' : 'default',
                border: `1px solid ${isActive ? COLORS.accent : COLORS.border}`,
                borderLeft: `3px solid ${isError ? COLORS.error : COLORS.warning}`,
                borderRadius: RADIUS.sm,
                padding: SPACING.sm,
                backgroundColor: isActive ? 'rgba(59,130,246,0.12)' : COLORS.surfaceElevated,
              }}
            >
              <Flex gap={SPACING.sm} align="center" style={{ flexWrap: 'wrap' } as React.CSSProperties}>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    padding: '0.1rem 0.4rem',
                    borderRadius: RADIUS.sm,
                    color: '#0b1220',
                    backgroundColor: isError ? COLORS.error : COLORS.warning,
                  }}
                >
                  {diagnostic.severity.toUpperCase()}
                </span>
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0 }}>
                  {describeCategory(diagnostic.category)}
                </Text>
                {diagnostic.line > 0 && (
                  <Text
                    as="p"
                    style={{
                      ...TYPOGRAPHY.small,
                      color: COLORS.textMuted,
                      margin: 0,
                      fontFamily: '"SF Mono", Menlo, monospace',
                      fontSize: '0.72rem',
                    }}
                  >
                    {diagnostic.file}:{diagnostic.line}
                    {diagnostic.column ? `:${diagnostic.column}` : ''}
                  </Text>
                )}
              </Flex>

              <Text
                as="p"
                style={{
                  ...TYPOGRAPHY.small,
                  color: COLORS.textPrimary,
                  margin: `${SPACING.xs} 0 0 0`,
                  fontFamily: '"SF Mono", Menlo, monospace',
                  fontSize: '0.75rem',
                  wordBreak: 'break-word',
                }}
              >
                {diagnostic.message}
              </Text>

              {diagnostic.sourceLine && (
                <Box
                  style={{
                    marginTop: SPACING.xs,
                    padding: `${SPACING.xs} ${SPACING.sm}`,
                    backgroundColor: '#0b1220',
                    borderRadius: RADIUS.sm,
                    fontFamily: '"SF Mono", Menlo, monospace',
                    fontSize: '0.73rem',
                    color: COLORS.textSecondary,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {diagnostic.sourceLine}
                </Box>
              )}

              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: `${SPACING.xs} 0 0 0` }}>
                {diagnostic.explanation}
              </Text>

              {diagnostic.suggestion && (
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.accent, margin: `${SPACING.xs} 0 0 0` }}>
                  → {diagnostic.suggestion}
                </Text>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
