import type { FunctionComponent } from 'react';
import { Box } from './primitives';
import { COLORS, RADIUS } from './Theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export const SearchBox: FunctionComponent<Props> = ({
  value,
  onChange,
  placeholder = 'Search algorithms...',
}) => {
  return (
    <Box
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 400,
      } as React.CSSProperties}
    >
      <input
        type="text"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.75rem 1rem 0.75rem 2.75rem',
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.md,
          color: COLORS.textPrimary,
          fontSize: '0.9375rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          outline: 'none',
          ':focus': {
            borderColor: COLORS.accent,
          },
          '::placeholder': {
            color: COLORS.textMuted,
          },
        } as unknown as React.CSSProperties}
      />
    </Box>
  );
};
