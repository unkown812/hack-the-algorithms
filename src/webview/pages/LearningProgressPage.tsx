import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { COLORS, SPACING, TYPOGRAPHY } from '../Theme';
import { PRACTICE_MESSAGES } from '../../shared/constants';
import { practiceApi, usePracticeMessages } from '../hooks/usePractice';
import { LearningDashboard, type ProgressView } from '../components/progress/LearningDashboard';

interface LearningProgressPageProps {
  onBack: () => void;
}

/** The learning progress dashboard with the statistics, topics and achievements. */
export const LearningProgressPage: FunctionComponent<LearningProgressPageProps> = ({ onBack }) => {
  const [progress, setProgress] = useState<ProgressView | null>(null);

  usePracticeMessages(
    useCallback((type, payload) => {
      if (type === PRACTICE_MESSAGES.PROGRESS_LOADED) {
        setProgress(payload as unknown as ProgressView);
      }
    }, [])
  );

  useEffect(() => {
    practiceApi.getProgress();
  }, []);

  return (
    <Box style={{ padding: SPACING.lg }}>
      <Flex gap={SPACING.md} align="center" justify="between" style={{ marginBottom: SPACING.lg } as React.CSSProperties}>
        <Box>
          <Text as="h1" style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: 0 }}>
            My progress
          </Text>
          <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: '0.25rem 0 0 0' }}>
            Everything is calculated from your own attempts and stored on this machine.
          </Text>
        </Box>
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </Flex>

      <LearningDashboard
        progress={progress}
        onReset={() => practiceApi.resetProgress()}
        onExport={() => practiceApi.exportProgress()}
      />
    </Box>
  );
};
