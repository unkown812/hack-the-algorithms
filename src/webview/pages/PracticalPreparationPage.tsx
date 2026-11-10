import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import { PRACTICE_MESSAGES } from '../../shared/constants';
import { practiceApi, usePracticeMessages } from '../hooks/usePractice';
import {
  PracticalPreparation,
  type PracticalDetail,
  type PracticalSummary,
} from '../components/practicals/PracticalPreparation';
import type { MockExam, VivaQuestion } from '../../core/practice/types';

interface PracticalPreparationPageProps {
  onBack: () => void;
}

/** The DAA practical examination preparation module. */
export const PracticalPreparationPage: FunctionComponent<PracticalPreparationPageProps> = ({
  onBack,
}) => {
  const [practicals, setPracticals] = useState<PracticalSummary[]>([]);
  const [selected, setSelected] = useState<PracticalDetail | null>(null);
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>([]);
  const [vivaIndex, setVivaIndex] = useState(0);
  const [vivaAnswer, setVivaAnswer] = useState('');
  const [understood, setUnderstood] = useState<boolean | null>(null);

  usePracticeMessages(
    useCallback((type, payload) => {
      switch (type) {
      case PRACTICE_MESSAGES.PRACTICALS_LOADED:
        setPracticals((payload.practicals as PracticalSummary[]) ?? []);
        break;
      case PRACTICE_MESSAGES.PRACTICAL_LOADED:
        setSelected((payload.practical as PracticalDetail) ?? null);
        break;
      case PRACTICE_MESSAGES.MOCK_EXAMS_LOADED:
        if (payload.exams) {
          setMockExams(payload.exams as MockExam[]);
        }
        break;
      case PRACTICE_MESSAGES.VIVA_LOADED:
        setVivaQuestions((payload.questions as VivaQuestion[]) ?? []);
        setVivaIndex(0);
        setVivaAnswer('');
        setUnderstood(null);
        break;
      default:
        break;
      }
    }, [])
  );

  useEffect(() => {
    practiceApi.getPracticals();
    practiceApi.getMockExams();
    practiceApi.getViva();
  }, []);

  const currentViva = vivaQuestions[vivaIndex];

  return (
    <Box style={{ padding: SPACING.lg }}>
      <Flex gap={SPACING.md} align="center" justify="between" style={{ marginBottom: SPACING.lg } as React.CSSProperties}>
        <Box>
          <Text as="h1" style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: 0 }}>
            Practical preparation
          </Text>
          <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: '0.25rem 0 0 0' }}>
            University-style practical exercises, mock papers and viva questions — with the verified C programs.
          </Text>
        </Box>
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </Flex>

      <PracticalPreparation
        practicals={practicals}
        selected={selected}
        onSelect={(practicalId, mode) => practiceApi.getPractical(practicalId, mode)}
        mockExams={mockExams}
        vivaQuestions={vivaQuestions}
        onPickViva={() => {
          setVivaIndex((previous) => (previous + 1) % Math.max(1, vivaQuestions.length));
          setVivaAnswer('');
          setUnderstood(null);
        }}
      />

      {currentViva && (
        <Box
          style={{
            marginTop: SPACING.lg,
            padding: SPACING.lg,
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.surface,
            display: 'grid',
            gap: SPACING.md,
          }}
        >
          <Flex gap={SPACING.sm} align="center">
            <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: 0, flex: 1 }}>
              Viva question {vivaIndex + 1} of {vivaQuestions.length}
            </Text>
          </Flex>

          <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textPrimary, margin: 0 }}>
            {currentViva.question}
          </Text>

          <textarea
            value={vivaAnswer}
            onChange={(event) => setVivaAnswer(event.target.value)}
            placeholder="Write your answer…"
            style={{
              width: '100%',
              minHeight: 100,
              padding: SPACING.md,
              backgroundColor: '#0b1220',
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.sm,
              color: COLORS.textPrimary,
              fontSize: '0.85rem',
              resize: 'vertical',
            }}
          />

          {understood === null ? (
            <Flex gap={SPACING.sm} align="center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setUnderstood(true)}
              >
                Compare with the expected answer
              </Button>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
                The extension does not judge a free-form answer — you decide whether you understood it.
              </Text>
            </Flex>
          ) : (
            <Box
              style={{
                padding: SPACING.md,
                borderRadius: RADIUS.sm,
                border: `1px solid ${understood ? COLORS.success : COLORS.warning}`,
                backgroundColor: understood ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
              }}
            >
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: '0 0 0.35rem 0', fontWeight: 600 }}>
                Expected answer
              </Text>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.75rem 0' }}>
                {currentViva.expectedAnswer}
              </Text>
              <Flex gap={SPACING.sm}>
                <Button variant="secondary" size="sm" onClick={() => setUnderstood(true)}>
                  I understood it
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setUnderstood(false)}>
                  I need to revise it
                </Button>
              </Flex>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
