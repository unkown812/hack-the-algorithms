import type { FunctionComponent } from 'react';
import { Box, Text } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';

type Props = {
  variables: Record<string, unknown>;
};

export const VariableInspector: FunctionComponent<Props> = ({ variables }) => {
  const entries = Object.entries(variables);

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
        as="h3"
        style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 1rem 0' } as React.CSSProperties}
      >
        Variable Inspector
      </Text>

      {entries.length === 0 && (
        <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted, margin: 0 } as React.CSSProperties}>
          No variables to display.
        </Text>
      )}

      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        } as React.CSSProperties}
      >
        {entries.map(([key, value]) => (
          <Box
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              borderBottom: `1px solid ${COLORS.border}`,
            } as React.CSSProperties}
          >
            <Text
              as="span"
              style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontFamily: 'monospace' } as React.CSSProperties}
            >
              {key}
            </Text>
            <Text
              as="span"
              style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontFamily: 'monospace', fontWeight: 600 } as React.CSSProperties}
            >
              {String(value)}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
