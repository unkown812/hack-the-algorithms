import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { MockExam, VivaQuestion } from '../../../core/practice/types';

export interface PracticalSummary {
  id: string;
  name: string;
  category: string;
  aim: string;
  problemStatement: string;
  timeComplexity: string;
  spaceComplexity: string;
  vivaCount: number;
}

export interface PracticalDetail {
  id: string;
  name: string;
  category: string;
  aim: string;
  problemStatement: string;
  theory?: string;
  algorithm?: string[];
  pseudocode?: string[];
  cProgram?: string;
  sampleInput?: string;
  sampleOutput?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  conclusion?: string;
  vivaQuestions?: VivaQuestion[];
}

interface PracticalPreparationProps {
  practicals: PracticalSummary[];
  selected: PracticalDetail | null;
  onSelect: (practicalId: string, mode: 'guided' | 'independent') => void;
  mockExams: MockExam[];
  vivaQuestions: VivaQuestion[];
  onPickViva: () => void;
}

/**
 * The practical preparation module: the university-style exercises, the mock
 * examinations and the viva practice.
 */
export const PracticalPreparation: FunctionComponent<PracticalPreparationProps> = ({
  practicals,
  selected,
  onSelect,
  mockExams,
  vivaQuestions,
  onPickViva,
}) => {
  const [mode, setMode] = useState<'guided' | 'independent'>('guided');

  return (
    <Box style={{ display: 'grid', gap: SPACING.lg }}>
      <Box
        style={{
          padding: SPACING.md,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.surface,
        }}
      >
        <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
          Mock practical examinations
        </Text>
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.75rem 0' }}>
          These are practice papers prepared by the extension — they imitate the structure of a university practical
          examination, but they are not an official examination.
        </Text>
        <Box style={{ display: 'grid', gap: SPACING.sm }}>
          {mockExams.map((exam) => (
            <Box
              key={exam.id}
              style={{
                padding: SPACING.sm,
                borderRadius: RADIUS.sm,
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.surfaceElevated,
              }}
            >
              <Flex gap={SPACING.sm} align="center" style={{ flexWrap: 'wrap' } as React.CSSProperties}>
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600, flex: 1 }}>
                  {exam.title}
                </Text>
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
                  {exam.practicalIds.length} practicals · {Math.round(exam.durationSeconds / 60)} min ·{' '}
                  {exam.totalMarks} marks
                </Text>
              </Flex>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: `${SPACING.xs} 0 0 0` }}>
                {exam.description}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        style={{
          padding: SPACING.md,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.surface,
        }}
      >
        <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
          Viva practice
        </Text>
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.75rem 0' }}>
          {vivaQuestions.length} oral-examination questions. Write your answer, compare it with the expected answer and
          mark whether you understood it — the extension never judges a free-form answer for you.
        </Text>
        <Button variant="secondary" size="sm" onClick={onPickViva}>
          Show a random viva question
        </Button>
      </Box>

      <Box
        style={{
          padding: SPACING.md,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.surface,
        }}
      >
        <Flex gap={SPACING.sm} align="center" style={{ marginBottom: SPACING.md } as React.CSSProperties}>
          <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: 0, flex: 1 }}>
            Practical exercises
          </Text>
          <Button
            variant={mode === 'guided' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMode('guided')}
          >
            Guided
          </Button>
          <Button
            variant={mode === 'independent' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMode('independent')}
          >
            Independent
          </Button>
        </Flex>

        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: SPACING.sm } as React.CSSProperties}>
          {practicals.map((practical) => (
            <Box
              key={practical.id}
              onClick={() => onSelect(practical.id, mode)}
              style={{
                padding: SPACING.sm,
                borderRadius: RADIUS.sm,
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.surfaceElevated,
                cursor: 'pointer',
              }}
            >
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
                {practical.name}
              </Text>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0, fontSize: '0.7rem' }}>
                {practical.category} · {practical.timeComplexity}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      {selected && (
        <Box
          style={{
            padding: SPACING.lg,
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.surface,
            display: 'grid',
            gap: SPACING.md,
          }}
        >
          <Box>
            <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: 0 }}>
              {selected.name}
            </Text>
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: `${SPACING.xs} 0 0 0` }}>
              {selected.aim}
            </Text>
          </Box>

          {selected.theory && (
            <Box>
              <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.35rem 0' }}>
                Theory
              </Text>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0 }}>
                {selected.theory}
              </Text>
            </Box>
          )}

          {selected.algorithm && (
            <Box>
              <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.35rem 0' }}>
                Algorithm
              </Text>
              <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {selected.algorithm.map((step, index) => (
                  <li key={index} style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary }}>
                    {step}
                  </li>
                ))}
              </ol>
            </Box>
          )}

          {selected.pseudocode && (
            <Box>
              <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.35rem 0' }}>
                Pseudocode
              </Text>
              <pre
                style={{
                  margin: 0,
                  padding: SPACING.md,
                  backgroundColor: '#0b1220',
                  borderRadius: RADIUS.sm,
                  fontFamily: '"SF Mono", Menlo, monospace',
                  fontSize: '0.76rem',
                  color: COLORS.textSecondary,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selected.pseudocode.join('\n')}
              </pre>
            </Box>
          )}

          {selected.cProgram && (
            <Box>
              <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.35rem 0' }}>
                C program
              </Text>
              <pre
                style={{
                  margin: 0,
                  padding: SPACING.md,
                  backgroundColor: '#0b1220',
                  borderRadius: RADIUS.sm,
                  fontFamily: '"SF Mono", Menlo, monospace',
                  fontSize: '0.74rem',
                  color: COLORS.textSecondary,
                  overflowX: 'auto',
                }}
              >
                {selected.cProgram}
              </pre>
            </Box>
          )}

          {selected.sampleInput !== undefined && (
            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING.md } as React.CSSProperties}>
              <Box>
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' }}>
                  Sample input
                </Text>
                <pre style={codeStyle}>{selected.sampleInput}</pre>
              </Box>
              <Box>
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' }}>
                  Sample output
                </Text>
                <pre style={codeStyle}>{selected.sampleOutput}</pre>
              </Box>
            </Box>
          )}

          {selected.conclusion && (
            <Box>
              <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.35rem 0' }}>
                Conclusion
              </Text>
              <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0 }}>
                {selected.conclusion}
              </Text>
            </Box>
          )}

          {selected.vivaQuestions && selected.vivaQuestions.length > 0 && (
            <Box>
              <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.5rem 0' }}>
                Viva questions
              </Text>
              <Box style={{ display: 'grid', gap: SPACING.sm }}>
                {selected.vivaQuestions.map((question) => (
                  <Box
                    key={question.id}
                    style={{
                      padding: SPACING.sm,
                      borderRadius: RADIUS.sm,
                      border: `1px solid ${COLORS.border}`,
                      backgroundColor: COLORS.surfaceElevated,
                    }}
                  >
                    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: '0 0 0.35rem 0', fontWeight: 600 }}>
                      {question.question}
                    </Text>
                    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0 }}>
                      {question.expectedAnswer}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const codeStyle: React.CSSProperties = {
  margin: 0,
  padding: SPACING.md,
  backgroundColor: '#0b1220',
  borderRadius: RADIUS.sm,
  fontFamily: '"SF Mono", Menlo, monospace',
  fontSize: '0.74rem',
  color: COLORS.textSecondary,
  whiteSpace: 'pre-wrap',
};
