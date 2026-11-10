import { useState } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { SearchBox } from '../components/SearchBox';
import { CategoryCard } from '../components/CategoryCard';
import { AlgorithmCard } from '../components/AlgorithmCard';
import { StatCard } from '../components/StatCard';
import { COLORS, SPACING, TYPOGRAPHY } from '../components/Theme';
import type { Algorithm } from '../../core/algorithms';

type Props = {
  algorithms: Algorithm[];
  onSelectAlgorithm: (id: string) => void;
  onOpenLibrary: () => void;
};

export const Dashboard = ({
  algorithms,
  onSelectAlgorithm,
  onOpenLibrary,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    ...new Set(algorithms.map((a) => a.category)),
  ].map((cat) => ({
    id: cat,
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    count: algorithms.filter((a) => a.category === cat).length,
  }));

  const filtered = algorithms.filter((algo) => {
    if (!searchQuery) {return true;}
    const q = searchQuery.toLowerCase();
    return (
      algo.name.toLowerCase().includes(q) ||
      algo.description.toLowerCase().includes(q) ||
      algo.tags.some((t: string) => t.toLowerCase().includes(q))
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
      <Box>
        <Flex justify="between" align="end" style={{ marginBottom: SPACING['2xl'] }}>
          <Box>
            <Text
              as="h1"
              style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}
            >
              DAA Learning Companion
            </Text>
            <Text
              as="p"
              style={{
                ...TYPOGRAPHY.body,
                color: COLORS.textSecondary,
                margin: '0.5rem 0 0 0',
                fontSize: '1.125rem',
              } as React.CSSProperties}
            >
              Understand Algorithms. Visualize Logic. Master Complexity.
            </Text>
          </Box>
          <Button variant="ghost" size="lg" onClick={onOpenLibrary}>
            Browse Library
          </Button>
        </Flex>
      </Box>

      <SearchBox
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search algorithms..."
      />

      <Box style={{ marginTop: SPACING.xl }}>
        <Text
          as="h2"
          style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: '0 0 1.5rem 0' } as React.CSSProperties}
        >
          Quick Actions
        </Text>
        <Flex gap={SPACING.md}>
          <Button onClick={onOpenLibrary}>
            Explore Algorithms
          </Button>
          <Button variant="secondary">
            Browse Practicals
          </Button>
          <Button variant="secondary">
            Search Algorithms
          </Button>
          <Button variant="secondary">
            Start Learning
          </Button>
        </Flex>
      </Box>

      <Box style={{ marginTop: SPACING.xl }}>
        <Flex justify="between" align="center" style={{ marginBottom: SPACING.lg }}>
          <Text
            as="h2"
            style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}
          >
            Algorithm Categories
          </Text>
        </Flex>
        <Flex gap={SPACING.md} style={{ flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              description={`Algorithms in the ${cat.name} category`}
              algorithmCount={cat.count}
              onClick={() => onSelectAlgorithm(cat.id)}
            />
          ))}
        </Flex>
      </Box>

      <Box style={{ marginTop: SPACING.xl }}>
        <Text
          as="h2"
          style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: '0 0 1.5rem 0' } as React.CSSProperties}
        >
          Learning Statistics
        </Text>
        <Flex gap={SPACING.md} style={{ flexWrap: 'wrap' }}>
          <StatCard label="Total Algorithms" value={algorithms.length} />
          <StatCard label="Categories" value={categories.length} subtitle="Available" />
          <StatCard label="Difficulty Levels" value="3" />
          <StatCard label="Primary Language" value="C" />
        </Flex>
      </Box>

      <Box style={{ marginTop: SPACING.xl }}>
        <Text
          as="h2"
          style={{ ...TYPOGRAPHY.h2, color: COLORS.textPrimary, margin: '0 0 1.5rem 0' } as React.CSSProperties}
        >
          Featured Algorithms
        </Text>
        <Flex gap={SPACING.md} style={{ flexWrap: 'wrap' }}>
          {filtered.slice(0, 6).map((algo) => (
            <AlgorithmCard
              key={algo.id}
              algorithm={algo}
              onSelect={onSelectAlgorithm}
            />
          ))}
        </Flex>
      </Box>
    </Box>
  );
};
