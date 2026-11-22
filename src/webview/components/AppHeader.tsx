import type { FunctionComponent } from 'react';
import { Box, Flex, Button } from './primitives';
import { COLORS, SPACING } from './Theme';

export type AppHeaderItem = {
  id: string;
  label: string;
};

type AppHeaderProps = {
  items: AppHeaderItem[];
  current: string;
  onNavigate: (_id: string) => void;
};

/**
 * The unified top navigation of the webview. The main modules of the learning
 * loop are reachable from one place; the deeper pages keep their own back
 * navigation.
 */
export const AppHeader: FunctionComponent<AppHeaderProps> = ({
  items,
  current,
  onNavigate,
}) => (
  <Box
    style={{
      backgroundColor: COLORS.surface,
      borderBottom: `1px solid ${COLORS.border}`,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    } as React.CSSProperties}
  >
    <Flex
      gap={SPACING.xs}
      align="center"
      wrap="wrap"
      style={{ padding: SPACING.sm } as React.CSSProperties}
      role="navigation"
      aria-label="Main learning modules"
    >
      {items.map((item) => {
        const isActive = item.id === current;
        return (
          <Button
            key={item.id}
            type="button"
            variant={isActive ? 'primary' : 'ghost'}
            size="sm"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </Button>
        );
      })}
    </Flex>
  </Box>
);
