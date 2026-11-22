import type { FunctionComponent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { QuizQuestion } from '../../../core/practice/types';

interface QuestionCardProps {
  entry: QuizQuestion;
  index: number;
  total: number;
  mode: 'learning' | 'test' | 'revision';
  onAnswer: (answer: string | string[]) => void;
  onToggleMark: () => void;
  /** True when the student already submitted the quiz. */
  submitted: boolean;
}

/**
 * One question with its options.
 * In test mode the feedback is only shown after the quiz was submitted.
 */
export const QuestionCard: FunctionComponent<QuestionCardProps> = ({
  entry,
  index,
  total,
  mode,
  onAnswer,
  onToggleMark,
  submitted,
}) => {
  const { question } = entry;
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState('');

  const isMultiple = question.type === 'multiple-select';
  const isFreeText =
    question.type === 'fill-blank' ||
    question.type === 'code-output' ||
    question.type === 'short-answer';

  const correctAnswers = useMemo(
    () => (Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer]),
    [question.correctAnswer]
  );

  const toggleOption = (option: string): void => {
    if (mode === 'test' && !submitted) {
      setSelected((previous) =>
        previous.includes(option)
          ? previous.filter((entryOption) => entryOption !== option)
          : [...previous, option]
      );
      return;
    }
    setSelected([option]);
    onAnswer([option]);
  };

  const submitFreeText = (): void => {
    onAnswer(text);
  };

  const showFeedback = mode !== 'test' || submitted;

  return (
    <Box>
      <Flex gap={SPACING.sm} align="center" justify="between" style={{ marginBottom: SPACING.sm } as React.CSSProperties}>
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
          Question {index + 1} of {total} · {question.difficulty} · {question.category}
        </Text>
        <Button variant="ghost" size="sm" onClick={onToggleMark}>
          {entry.marked ? '★ Marked' : '☆ Mark for review'}
        </Button>
      </Flex>

      <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.75rem 0' }}>
        {question.question}
      </Text>

      {question.code && (
        <Box
          style={{
            backgroundColor: '#0b1220',
            borderRadius: RADIUS.sm,
            padding: SPACING.md,
            marginBottom: SPACING.md,
            overflowX: 'auto',
          }}
        >
          <pre
            style={{
              margin: 0,
              fontFamily: '"SF Mono", Menlo, monospace',
              fontSize: '0.78rem',
              lineHeight: 1.55,
              color: COLORS.textSecondary,
            }}
          >
            {question.code}
          </pre>
        </Box>
      )}

      {question.options && !isFreeText && (
        <Box style={{ display: 'grid', gap: SPACING.sm }}>
          {question.options.map((option) => {
            const chosen = selected.includes(option);
            const isCorrect = correctAnswers.includes(option);
            const highlight = showFeedback && isCorrect;
            const wrongChoice = showFeedback && chosen && !isCorrect;

            return (
              <Flex
                key={option}
                gap={SPACING.sm}
                align="center"
                onClick={() => toggleOption(option)}
                style={{
                  cursor: mode === 'test' && !submitted ? 'pointer' : 'default',
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${highlight ? COLORS.success : wrongChoice ? COLORS.error : COLORS.border}`,
                  backgroundColor: highlight
                    ? 'rgba(34, 197, 94, 0.12)'
                    : wrongChoice
                      ? 'rgba(239, 68, 68, 0.12)'
                      : chosen
                        ? 'rgba(59, 130, 246, 0.12)'
                        : COLORS.surfaceElevated,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: isMultiple ? 3 : 7,
                    border: `1px solid ${chosen ? COLORS.accent : COLORS.textMuted}`,
                    backgroundColor: chosen ? COLORS.accent : 'transparent',
                    flexShrink: 0,
                  }}
                />
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0 }}>
                  {option}
                </Text>
              </Flex>
            );
          })}
        </Box>
      )}

      {isFreeText && (
        <Box>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={mode === 'test' && !submitted}
            placeholder={
              question.type === 'code-output'
                ? 'Type the exact output of the program'
                : question.type === 'fill-blank'
                  ? 'Type the missing term'
                  : 'Write your answer'
            }
            style={{
              width: '100%',
              minHeight: 90,
              padding: SPACING.sm,
              backgroundColor: '#0b1220',
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.sm,
              color: COLORS.textPrimary,
              fontFamily: '"SF Mono", Menlo, monospace',
              fontSize: '0.78rem',
              resize: 'vertical',
            }}
          />
          <Flex justify="flex-end" style={{ marginTop: SPACING.sm } as React.CSSProperties}>
            <Button variant="secondary" size="sm" onClick={submitFreeText} disabled={text.trim() === ''}>
              Check answer
            </Button>
          </Flex>
        </Box>
      )}

      {isMultiple && mode === 'test' && !submitted && (
        <Flex justify="flex-end" style={{ marginTop: SPACING.sm } as React.CSSProperties}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onAnswer(selected)}
            disabled={selected.length === 0}
          >
            Confirm selection
          </Button>
        </Flex>
      )}

      {showFeedback && (
        <Box
          style={{
            marginTop: SPACING.md,
            padding: SPACING.md,
            borderRadius: RADIUS.sm,
            border: `1px solid ${entry.correct ? COLORS.success : COLORS.warning}`,
            backgroundColor: entry.correct ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          }}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: '0 0 0.35rem 0', fontWeight: 600 }}>
            {entry.correct ? 'Correct' : 'Not correct'}
          </Text>
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0 }}>
            {question.explanation}
          </Text>
        </Box>
      )}
    </Box>
  );
};

interface QuizTimerProps {
  /** The remaining seconds; undefined means the quiz is not timed. */
  remainingSeconds?: number;
  totalSeconds?: number;
}

/** The countdown of a timed quiz. */
export const QuizTimer: FunctionComponent<QuizTimerProps> = ({ remainingSeconds, totalSeconds }) => {
  if (remainingSeconds === undefined) {
    return (
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
        No time limit
      </Text>
    );
  }

  const minutes = Math.floor(Math.max(0, remainingSeconds) / 60);
  const seconds = Math.max(0, remainingSeconds) % 60;
  const low = remainingSeconds <= 30;

  return (
    <Text
      as="p"
      style={{
        ...TYPOGRAPHY.small,
        color: low ? COLORS.error : COLORS.textPrimary,
        margin: 0,
        fontFamily: '"SF Mono", Menlo, monospace',
        fontWeight: 600,
      }}
    >
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      {totalSeconds ? ` of ${Math.round(totalSeconds / 60)} min` : ''}
    </Text>
  );
};

interface QuestionNavigatorProps {
  entries: QuizQuestion[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

/** The grid that shows the state of every question. */
export const QuestionNavigator: FunctionComponent<QuestionNavigatorProps> = ({
  entries,
  currentIndex,
  onSelect,
}) => (
  <Flex gap={SPACING.xs} style={{ flexWrap: 'wrap' } as React.CSSProperties}>
    {entries.map((entry, index) => {
      const background = entry.marked
        ? COLORS.warning
        : entry.answered
          ? COLORS.success
          : COLORS.surfaceElevated;
      const color = entry.marked || entry.answered ? '#0b1220' : COLORS.textSecondary;

      return (
        <button
          key={entry.question.id}
          onClick={() => onSelect(index)}
          title={entry.question.title}
          style={{
            width: 30,
            height: 30,
            borderRadius: RADIUS.sm,
            border: index === currentIndex ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
            backgroundColor: background,
            color,
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {index + 1}
        </button>
      );
    })}
  </Flex>
);

/** Counts the answers of a quiz for the summary line. */
export function countAnswers(entries: QuizQuestion[]): {
  answered: number;
  marked: number;
} {
  return {
    answered: entries.filter((entry) => entry.answered).length,
    marked: entries.filter((entry) => entry.marked).length,
  };
}

/** Runs the countdown of a timed quiz. */
export function useCountdown(durationSeconds: number | undefined, onExpire: () => void): number | undefined {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    setRemaining(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (durationSeconds === undefined) {
      return;
    }
    const timer = setInterval(() => {
      setRemaining((previous) => {
        if (previous === undefined) {
          return undefined;
        }
        if (previous <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [durationSeconds]);

  return remaining;
}
