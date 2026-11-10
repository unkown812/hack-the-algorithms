import { useState } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { SearchBox } from '../components/SearchBox';
import { AlgorithmCard } from '../components/AlgorithmCard';
import { COLORS, SPACING, TYPOGRAPHY } from '../components/Theme';
import type { Algorithm } from '../../core/algorithms';

type Props = {
  algorithms: Algorithm[];
  onSelectAlgorithm: (id: string) => void;
  onBack: () => void;
};

export const AlgorithmLibrary = ({
  algorithms,
  onSelectAlgorithm,
  onBack,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = algorithms.filter((algo) => {
    if (!searchQuery) {return true;}
    const q = searchQuery.toLowerCase();
    return (
      algo.name.toLowerCase().includes(q) ||
      algo.description.toLowerCase().includes(q) ||
      algo.tags.some((t: string) => t.toLowerCase().includes(q)) ||
      algo.category.toLowerCase().includes(q)
    );
  });

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
          ← Back to Dashboard
        </Button>
      </Box>

      <Text
        as="h1"
        style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: '0 0 1.5rem 0' } as React.CSSProperties}
      >
        Algorithm Library
      </Text>

      <SearchBox
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search algorithms..."
      />

      <Box style={{ marginTop: SPACING.lg }}>
        <Text
          as="p"
          style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: 0 } as React.CSSProperties}
        >
          {filtered.length} algorithm{filtered.length !== 1 ? 's' : ''} found
        </Text>
      </Box>

      <Flex gap={SPACING.md} style={{ marginTop: SPACING.lg, flexWrap: 'wrap' }}>
        {filtered.map((algo) => (
          <Box key={algo.id} style={{ flex: '1 1 300px', minWidth: 280 } as React.CSSProperties}>
            <AlgorithmCard
              algorithm={algo}
              onSelect={onSelectAlgorithm}
            />
          </Box>
        ))}
        {filtered.length === 0 && (
          <Box style={{ flexBasis: '100%', textAlign: 'center', padding: SPACING.xl } as React.CSSProperties}>
            <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted, margin: 0 } as React.CSSProperties}>
              No algorithms found matching your search.
            </Text>
          </Box>
        )}
      </Flex>
    </Box>
  );
};
