import type { FunctionComponent } from 'react';
import { Box } from './primitives';
import { COLORS } from './Theme';

type Props = {
  children: React.ReactNode;
};

export const Layout: FunctionComponent<Props> = ({ children }) => {
  return (
    <Box
      style={{
        backgroundColor: COLORS.background,
        minHeight: '100vh',
        color: COLORS.textPrimary,
      } as React.CSSProperties}
    >
      {children}
    </Box>
  );
};
