import type { FunctionComponent } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';

/** The modules of the companion, in the order of the onboarding path. */
export type OnboardingStepId =
  | 'library'
  | 'visualizer'
  | 'playground'
  | 'analyzer'
  | 'practice'
  | 'assistant'
  | 'progress';

interface OnboardingPageProps {
  /** Opens the module the student picked in the onboarding. */
  onNavigate: (_step: OnboardingStepId) => void;
  onBack: () => void;
}

interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
}

const STEPS: Array<OnboardingStep> = [
  {
    id: 'library',
    title: 'Algorithm Library',
    description: 'Browse the reviewed algorithms with theory, pseudocode and complexity.',
  },
  {
    id: 'visualizer',
    title: 'Visualization',
    description: 'Step through an algorithm with a deterministic trace and playback controls.',
  },
  {
    id: 'playground',
    title: 'Code Playground',
    description: 'Write, compile, run and debug your own C implementation with the local GCC toolchain.',
  },
  {
    id: 'analyzer',
    title: 'Complexity Analysis',
    description: 'Compare theoretical classes, instrumented counts, benchmarks and space usage.',
  },
  {
    id: 'practice',
    title: 'Practice Centre',
    description: 'Quizzes, coding challenges, practicals, viva preparation and achievements.',
  },
  {
    id: 'assistant',
    title: 'AI Assistant',
    description: 'Ask the tutor about algorithms, code, complexity, visualizations and exams.',
  },
  {
    id: 'progress',
    title: 'Progress',
    description: 'Follow your statistics, bookmarks, achievements and revision plan.',
  },
];

/**
 * The first-run onboarding of the extension: a short, module-oriented path
 * through the learning loop. Every step can also be reached from the dashboard.
 */
export const OnboardingPage: FunctionComponent<OnboardingPageProps> = ({
  onNavigate,
  onBack,
}) => (
  <Box
    style={{
      padding: SPACING['2xl'],
      maxWidth: 900,
      margin: '0 auto',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: COLORS.textPrimary,
      backgroundColor: COLORS.background,
    } as React.CSSProperties}
  >
    <Box style={{ marginBottom: SPACING.lg }}>
      <Button variant="ghost" onClick={onBack}>
        ← Back to Dashboard
      </Button>
    </Box>

    <Text
      as="h1"
      style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' } as React.CSSProperties}
    >
      Welcome to the DAA Learning Companion
    </Text>
    <Text
      as="p"
      style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: 0 } as React.CSSProperties}
    >
      Learn → Understand → Visualize → Implement → Analyze → Practice → Assess.
      The seven modules of the extension are described below; pick the one you want
      to start with.
    </Text>

    <Flex direction="column" gap={SPACING.md} style={{ marginTop: SPACING.xl } as React.CSSProperties}>
      {STEPS.map((step, index) => (
        <Box
          key={step.id}
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          } as React.CSSProperties}
        >
          <Flex justify="between" align="start" gap={SPACING.md} wrap="wrap">
            <Box>
              <Text
                as="h2"
                style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}
              >
                {index + 1}. {step.title}
              </Text>
              <Text
                as="p"
                style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0.35rem 0 0 0' } as React.CSSProperties}
              >
                {step.description}
              </Text>
            </Box>
            <Button variant="primary" size="sm" onClick={() => onNavigate(step.id)}>
              Open
            </Button>
          </Flex>
        </Box>
      ))}
    </Flex>

    <Text
      as="p"
      style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, marginTop: SPACING.xl } as React.CSSProperties}
    >
      The code playground uses the GCC toolchain of your machine; the AI assistant works
      offline with the bundled learning resources until you configure a provider.
    </Text>
  </Box>
);
