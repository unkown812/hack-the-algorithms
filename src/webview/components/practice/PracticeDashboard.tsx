import type { FunctionComponent } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { QuizConfig } from '../../../core/practice/types';

export interface PracticeOverview {
  questionCount: number;
  challengeCount: number;
  practicalCount: number;
  vivaCount: number;
  mockExamCount: number;
  categories: Array<{ id: string; label: string; category: string }>;
  presets: QuizConfig[];
  bankIssues: number;
}

interface PracticeDashboardProps {
  overview: PracticeOverview | null;
  onStartQuiz: (config: QuizConfig) => void;
  onOpenTopic: (category: string) => void;
  onOpenChallenges: () => void;
  onOpenPracticals: () => void;
  onOpenProgress: () => void;
  onOpenQuizBuilder: () => void;
  /** A quiz that was left open in an earlier session. */
  activeQuizTitle?: string;
  onResumeQuiz: () => void;
}

/**
 * The home screen of the practice centre: quick practice, topic-wise practice
 * and the entrances to the coding challenges, the practicals and the progress.
 */
export const PracticeDashboard: FunctionComponent<PracticeDashboardProps> = ({
  overview,
  onStartQuiz,
  onOpenTopic,
  onOpenChallenges,
  onOpenPracticals,
  onOpenProgress,
  onOpenQuizBuilder,
  activeQuizTitle,
  onResumeQuiz,
}) => {
  if (!overview) {
    return (
      <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted, margin: 0 }}>
        Loading the practice centre…
      </Text>
    );
  }

  return (
    <Box style={{ display: 'grid', gap: SPACING.lg }}>
      {activeQuizTitle && (
        <Box
          style={{
            padding: SPACING.md,
            borderRadius: RADIUS.md,
            border: `1px solid ${COLORS.accent}`,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          }}
        >
          <Flex gap={SPACING.md} align="center" style={{ flexWrap: 'wrap' } as React.CSSProperties}>
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, flex: 1 }}>
              You have an unfinished quiz: <strong>{activeQuizTitle}</strong>
            </Text>
            <Button variant="secondary" size="sm" onClick={onResumeQuiz}>
              Continue the quiz
            </Button>
          </Flex>
        </Box>
      )}

      <Box
        style={{
          padding: SPACING.lg,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.surface,
        }}
      >
        <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.75rem 0' }}>
          Quick practice
        </Text>
        <Flex gap={SPACING.sm} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
          {overview.presets.map((preset) => (
            <Button
              key={preset.id}
              variant={preset.mode === 'test' ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => onStartQuiz(preset)}
            >
              {preset.title} · {preset.questionCount} questions
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={onOpenQuizBuilder}>
            Custom quiz…
          </Button>
        </Flex>
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: `${SPACING.sm} 0 0 0` }}>
          Learning mode shows the explanation after every answer; test mode keeps the feedback until the quiz is
          submitted.
        </Text>
      </Box>

      <Box
        style={{
          padding: SPACING.lg,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.surface,
        }}
      >
        <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.75rem 0' }}>
          Topic-wise practice
        </Text>
        <Flex gap={SPACING.sm} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
          {overview.categories.map((category) => (
            <Button key={category.id} variant="secondary" size="sm" onClick={() => onOpenTopic(category.id)}>
              {category.label}
            </Button>
          ))}
        </Flex>
      </Box>

      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: SPACING.md } as React.CSSProperties}>
        <SectionCard
          title="Coding challenges"
          description={`${overview.challengeCount} problems with automated test cases — the solution is compiled and run locally.`}
          action="Open challenges"
          onClick={onOpenChallenges}
        />
        <SectionCard
          title="Practical preparation"
          description={`${overview.practicalCount} university-style practicals, ${overview.mockExamCount} mock papers and ${overview.vivaCount} viva questions.`}
          action="Open practicals"
          onClick={onOpenPracticals}
        />
        <SectionCard
          title="My progress"
          description="Attempt history, topic statistics, weak topics and the revision list."
          action="Open progress"
          onClick={onOpenProgress}
        />
      </Box>

      <Flex gap={SPACING.md} align="center" style={{ flexWrap: 'wrap' } as React.CSSProperties}>
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
          {overview.questionCount} curated questions are bundled with the extension — every quiz works offline.
        </Text>
        {overview.bankIssues > 0 && (
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.warning, margin: 0 }}>
            {overview.bankIssues} question(s) failed the self check.
          </Text>
        )}
      </Flex>
    </Box>
  );
};

const SectionCard: FunctionComponent<{
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}> = ({ title, description, action, onClick }) => (
  <Box
    style={{
      padding: SPACING.md,
      borderRadius: RADIUS.lg,
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.surface,
      display: 'grid',
      gap: SPACING.sm,
      alignContent: 'start',
    }}
  >
    <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: 0 }}>
      {title}
    </Text>
    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0 }}>
      {description}
    </Text>
    <Button variant="secondary" size="sm" onClick={onClick} style={{ justifySelf: 'start' }}>
      {action}
    </Button>
  </Box>
);
