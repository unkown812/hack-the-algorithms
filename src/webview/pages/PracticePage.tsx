import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import { PRACTICE_MESSAGES } from '../../shared/constants';
import { practiceApi, usePracticeMessages } from '../hooks/usePractice';
import { PracticeDashboard } from '../components/practice/PracticeDashboard';
import type { PracticeOverview } from '../components/practice/PracticeDashboard';
import type { Question, QuizConfig } from '../../core/practice/types';

interface PracticePageProps {
  onOpenQuiz: (config: QuizConfig) => void;
  onOpenChallenges: () => void;
  onOpenPracticals: () => void;
  onOpenProgress: () => void;
  onBack: () => void;
}

/**
 * The Practice Centre: quick practice, topic-wise practice and the entrance
 * to the coding challenges, the practicals and the progress dashboard.
 */
export const PracticePage: FunctionComponent<PracticePageProps> = ({
  onOpenQuiz,
  onOpenChallenges,
  onOpenPracticals,
  onOpenProgress,
  onBack,
}) => {
  const [overview, setOverview] = useState<PracticeOverview | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuizTitle, setActiveQuizTitle] = useState<string | undefined>(undefined);
  const [showBuilder, setShowBuilder] = useState(false);

  const [builderCount, setBuilderCount] = useState(10);
  const [builderCategory, setBuilderCategory] = useState('');
  const [builderMode, setBuilderMode] = useState<'learning' | 'test'>('learning');

  usePracticeMessages(
    useCallback((type, payload) => {
      switch (type) {
      case PRACTICE_MESSAGES.PRACTICE_OVERVIEW:
        setOverview(payload as unknown as PracticeOverview);
        break;
      case PRACTICE_MESSAGES.QUESTIONS_LOADED:
        setQuestions((payload.questions as Question[]) ?? []);
        break;
      case PRACTICE_MESSAGES.QUIZ_STARTED:
        setActiveQuizTitle((payload.attempt as { quizTitle?: string } | undefined)?.quizTitle);
        break;
      default:
        break;
      }
    }, [])
  );

  useEffect(() => {
    practiceApi.getOverview();
    practiceApi.getActiveQuiz();
  }, []);

  const openTopic = (category: string): void => {
    setTopic(category);
    practiceApi.getQuestions({ category });
  };

  const startCustomQuiz = (): void => {
    onOpenQuiz({
      id: `custom-${Date.now().toString(36)}`,
      title: 'Custom quiz',
      questionCount: builderCount,
      category: builderCategory || undefined,
      mode: builderMode,
      negativeMarking: 0,
    });
  };

  return (
    <Box style={{ padding: SPACING.lg }}>
      <Flex gap={SPACING.md} align="center" justify="between" style={{ marginBottom: SPACING.lg, flexWrap: 'wrap' } as React.CSSProperties}>
        <Box>
          <Text as="h1" style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: 0 }}>
            Practice Centre
          </Text>
          <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: '0.25rem 0 0 0' }}>
            Quizzes, coding challenges, practical preparation and your progress — all of it works offline.
          </Text>
        </Box>
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </Flex>

      {topic ? (
        <Box style={{ display: 'grid', gap: SPACING.md }}>
          <Flex gap={SPACING.sm} align="center">
            <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: 0, flex: 1 }}>
              {overview?.categories.find((entry) => entry.id === topic)?.label ?? topic}
            </Text>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onOpenQuiz({
                  id: `topic-${topic}`,
                  title: `${overview?.categories.find((entry) => entry.id === topic)?.label ?? topic} quiz`,
                  category: topic,
                  questionCount: 10,
                  mode: 'learning',
                  negativeMarking: 0,
                })
              }
            >
              Start a 10 question quiz
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setTopic(null)}>
              Back to the overview
            </Button>
          </Flex>

          {questions.length === 0 ? (
            <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted, margin: 0 }}>
              No questions in this topic yet.
            </Text>
          ) : (
            <Box style={{ display: 'grid', gap: SPACING.sm }}>
              {questions.map((question) => (
                <Box
                  key={question.id}
                  style={{
                    padding: SPACING.md,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: COLORS.surface,
                  }}
                >
                  <Flex gap={SPACING.sm} align="center" style={{ marginBottom: '0.35rem' } as React.CSSProperties}>
                    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
                      {question.difficulty} · {question.type}
                    </Text>
                    <span style={{ flex: 1 }} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        practiceApi.toggleBookmark({
                          kind: 'question',
                          itemId: question.id,
                          title: question.title,
                          category: question.category,
                        })
                      }
                    >
                      Bookmark
                    </Button>
                  </Flex>
                  <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
                    {question.title}
                  </Text>
                  <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0.25rem 0 0 0' }}>
                    {question.question}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ) : (
        <Box style={{ display: 'grid', gap: SPACING.lg }}>
          {showBuilder && (
            <Box
              style={{
                padding: SPACING.md,
                borderRadius: RADIUS.lg,
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.surface,
                display: 'grid',
                gap: SPACING.sm,
              }}
            >
              <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: 0 }}>
                Custom quiz
              </Text>
              <Flex gap={SPACING.md} align="center" style={{ flexWrap: 'wrap' } as React.CSSProperties}>
                <label style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary }}>
                  Questions{' '}
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={builderCount}
                    onChange={(event) => setBuilderCount(Math.max(1, Math.min(30, Number(event.target.value) || 1)))}
                    style={inputStyle}
                  />
                </label>
                <label style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary }}>
                  Topic{' '}
                  <select
                    value={builderCategory}
                    onChange={(event) => setBuilderCategory(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">All topics</option>
                    {overview?.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary }}>
                  Mode{' '}
                  <select
                    value={builderMode}
                    onChange={(event) => setBuilderMode(event.target.value as 'learning' | 'test')}
                    style={inputStyle}
                  >
                    <option value="learning">Learning — feedback after every answer</option>
                    <option value="test">Test — feedback after the submission</option>
                  </select>
                </label>
                <Button variant="primary" size="sm" onClick={startCustomQuiz}>
                  Start the quiz
                </Button>
              </Flex>
            </Box>
          )}

          <PracticeDashboard
            overview={overview}
            onStartQuiz={onOpenQuiz}
            onOpenTopic={openTopic}
            onOpenChallenges={onOpenChallenges}
            onOpenPracticals={onOpenPracticals}
            onOpenProgress={onOpenProgress}
            onOpenQuizBuilder={() => setShowBuilder((previous) => !previous)}
            activeQuizTitle={activeQuizTitle}
            onResumeQuiz={() => {
              practiceApi.getActiveQuiz();
              setActiveQuizTitle(activeQuizTitle);
            }}
          />
        </Box>
      )}
    </Box>
  );
};

const inputStyle: React.CSSProperties = {
  padding: '0.3rem 0.45rem',
  marginLeft: SPACING.xs,
  backgroundColor: COLORS.surfaceElevated,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.sm,
  color: COLORS.textPrimary,
  fontSize: '0.8rem',
};
