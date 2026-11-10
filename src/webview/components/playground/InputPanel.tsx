import type { FunctionComponent } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  /** Reusable input samples offered as one-click presets. */
  presets: Array<{ name: string; value: string }>;
  onUsePreset: (value: string) => void;
  onClear: () => void;
}

/**
 * The standard input panel of the playground.
 * Everything the program reads with scanf/gets is written here — students
 * never have to hardcode input into their source code.
 */
export const InputPanel: FunctionComponent<InputPanelProps> = ({
  value,
  onChange,
  presets,
  onUsePreset,
  onClear,
}) => (
  <Box
    style={{
      backgroundColor: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
    }}
  >
    <Flex gap={SPACING.sm} align="center" justify="between" style={{ marginBottom: SPACING.sm } as React.CSSProperties}>
      <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: 0 }}>
        Standard input
      </Text>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
    </Flex>

    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      spellCheck={false}
      placeholder={'5\n10 20 30 40 50'}
      style={{
        width: '100%',
        minHeight: 90,
        padding: SPACING.sm,
        backgroundColor: '#0b1220',
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.sm,
        color: COLORS.textPrimary,
        fontFamily: '"SF Mono", Menlo, Consolas, monospace',
        fontSize: '0.78rem',
        lineHeight: 1.5,
        resize: 'vertical',
      }}
    />

    {presets.length > 0 && (
      <Flex gap={SPACING.xs} align="center" style={{ flexWrap: 'wrap', marginTop: SPACING.sm } as React.CSSProperties}>
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: `0 ${SPACING.xs} 0 0` }}>
          Presets:
        </Text>
        {presets.map((preset) => (
          <Button key={preset.name} variant="ghost" size="sm" onClick={() => onUsePreset(preset.value)}>
            {preset.name}
          </Button>
        ))}
      </Flex>
    )}
  </Box>
);
