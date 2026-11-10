import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import { PRACTICE_MESSAGES } from '../../shared/constants';
import { practiceApi, usePracticeMessages } from '../hooks/usePractice';
import {
  QuestionCard,
  QuestionNavigator,
  QuizTimer,
  countAnswers,
  useCountdown,
} from '../components/quizzes/QuizWorkspace';
import { QuizResultView } from '../components/quizzes/QuizResult';
import type { QuizAttempt, QuizQuestion, QuizResult } from '../../core/practice/types';

interface QuizPageProps {
  /** The configuration of the quiz that should be started. */
  config?: {
    id: string;
    title: string;
    questionCount: number;
    category?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    mode: 'learning' | 'test' | 'revision';
    negativeMarking?: number;
  };
  onBack: () => void;
}

/**
 * The quiz workspace: the question, the timer, the navigation and the result.
 */
export const QuizPage: FunctionComponent<QuizPageProps> = ({ config, onBack }) => {
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [entries, setEntries] = useState<QuizQuestion[]>([]);
  const [scoring, setScoring] = useState('');
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePracticeMessages(
    useCallback((type, payload) => {
      switch (type) {
      case PRACTICE_MESSAGES.QUIZ_STARTED: {
        if (payload.attempt && payload.questions) {
          setAttempt(payload.attempt as QuizAttempt);
          setEntries(payload.questions as QuizQuestion[]);
          setScoring((payload.scoring as string) ?? '');
          setIndex(0);
          setResult(null);
        }
        break;
      }
      case PRACTICE_MESSAGES.QUIZ_RESULT: {
        if (payload.result) {
          setResult(payload.result as QuizResult);
          setEntries((payload.result as QuizResult).questions);
        }
        break;
      }
      case PRACTICE_MESSAGES.PRACTICE_ERROR: {
        setError(String(payload.message ?? 'The quiz could not be started.'));
        break;
      }
      default:
        break;
      }
    }, [])
  );

  useEffect(() => {
    if (config) {
      practiceApi.startQuiz(config);
    }
  }, [config]);

  const submit = useCallback(() => {
    if (attempt) {
      practiceApi.submitQuiz(attempt.id);
    }
  }, [attempt]);

  const remaining = useCountdown(
    result ? undefined : 15 * 60,
    submit
  );

  const counts = countAnswers(entries);
  const current = entries[index];

  return (
    <Box style={{ padding: SPACING.lg }}>
      <Flex gap={SPACING.md} align="center" justify="between" style={{ marginBottom: SPACING.lg, flexWrap: 'wrap' } as React.CSSProperties}>
        <Box>
          <Text as="h1" style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: 0 }}>
            {attempt?.quizTitle ?? 'Quiz'}
          </Text>
          {scoring && (
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0.25rem 0 0 0' }}>
              {scoring}
            </Text>
          )}
        </Box>
        <Flex gap={SPACING.md} align="center">
          <QuizTimer remainingSeconds={remaining} totalSeconds={15 * 60} />
          <Button variant="ghost" onClick={onBack}>
            Leave the quiz
          </Button>
          <Button variant="primary" onClick={submit} disabled={!attempt || Boolean(result)}>
            Submit the quiz
          </Button>
        </Flex>
      </Flex>

      {error && (
        <Box
          style={{
            padding: SPACING.md,
            borderRadius: RADIUS.md,
            border: `1px solid ${COLORS.error}`,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            marginBottom: SPACING.md,
          }}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0 }}>
            {error}
          </Text>
        </Box>
      )}

      {result ? (
        <QuizResultView
          result={result}
          onRestart={() => {
            setResult(null);
            if (config) {
              practiceApi.startQuiz(config);
            }
          }}
          onBack={onBack}
        />
      ) : current ? (
        <Box style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: SPACING.lg, alignItems: 'start' } as React.CSSProperties}>
          <Box
            style={{
              padding: SPACING.lg,
              borderRadius: RADIUS.lg,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surface,
            }}
          >
            <QuestionCard
              entry={current}
              index={index}
              total={entries.length}
              mode={attempt?.mode ?? 'learning'}
              submitted={false}
              onAnswer={(answer) => {
                if (attempt) {
                  practiceApi.answerQuiz(attempt.id, current.question.id, answer);
                }
              }}
              onToggleMark={() => {
                if (attempt) {
                  practiceApi.markQuestion(attempt.id, current.question.id, !current.marked);
                }
              }}
            />

            <Flex gap={SPACING.sm} align="center" justify="between" style={{ marginTop: SPACING.lg } as React.CSSProperties}>
              <Button variant="ghost" size="sm" onClick={() => setIndex((previous) => Math.max(0, previous - 1))} disabled={index === 0}>
                ← Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIndex((previous) => Math.min(entries.length - 1, previous + 1))}
                disabled={index >= entries.length - 1}
              >
                Next →
              </Button>
            </Flex>
          </Box>

          <Box
            style={{
              padding: SPACING.md,
              borderRadius: RADIUS.lg,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surface,
              display: 'grid',
              gap: SPACING.md,
            }}
          >
            <Box>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.5rem 0' }}>
                Question navigator
              </Text>
              <QuestionNavigator entries={entries} currentIndex={index} onSelect={setIndex} />
            </Box>
            <Box>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
                {counts.answered} of {entries.length} answered · {counts.marked} marked for review
              </Text>
            </Box>
          </Box>
        </Box>
      ) : (
        <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted, margin: 0 }}>
          Preparing the quiz…
        </Text>
      )}
    </Box>
  );
};
