import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import { CodeEditor } from '../playground/CodeEditor';
import type { ChallengeSubmission, CodingChallenge } from '../../../core/practice/types';

interface ChallengeExplorerProps {
  challenges: CodingChallenge[];
  selected: CodingChallenge | null;
  onSelect: (challengeId: string) => void;
  source: string;
  onSourceChange: (source: string) => void;
  onSubmit: () => void;
  onShowSolution: () => void;
  submission: ChallengeSubmission | null;
  feedback: string;
  isRunning: boolean;
}

/**
 * The coding challenge explorer.
 *
 * The editor is the Phase 5 code editor — there is no second editor — and the
 * evaluation happens in the extension host with the Phase 5 execution service.
 */
export const ChallengeExplorer: FunctionComponent<ChallengeExplorerProps> = ({
  challenges,
  selected,
  onSelect,
  source,
  onSourceChange,
  onSubmit,
  onShowSolution,
  submission,
  feedback,
  isRunning,
}) => {
  const [filter, setFilter] = useState('');
  const visible = challenges.filter((challenge) =>
    filter === ''
      ? true
      : challenge.title.toLowerCase().includes(filter.toLowerCase()) ||
        challenge.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Box style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: SPACING.lg, alignItems: 'start' } as React.CSSProperties}>
      <Box
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          display: 'grid',
          gap: SPACING.sm,
          maxHeight: 560,
          overflowY: 'auto',
        }}
      >
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter challenges…"
          style={{
            padding: '0.4rem 0.5rem',
            backgroundColor: COLORS.surfaceElevated,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.sm,
            color: COLORS.textPrimary,
            fontSize: '0.8rem',
          }}
        />
        {visible.map((challenge) => (
          <Box
            key={challenge.id}
            onClick={() => onSelect(challenge.id)}
            style={{
              padding: SPACING.sm,
              borderRadius: RADIUS.sm,
              cursor: 'pointer',
              border: `1px solid ${selected?.id === challenge.id ? COLORS.accent : 'transparent'}`,
              backgroundColor: selected?.id === challenge.id ? 'rgba(59,130,246,0.12)' : 'transparent',
            }}
          >
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
              {challenge.title}
            </Text>
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0, fontSize: '0.7rem' }}>
              {challenge.difficulty} · {challenge.category}
            </Text>
          </Box>
        ))}
      </Box>

      <Box style={{ display: 'grid', gap: SPACING.md }}>
        {!selected ? (
          <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted, margin: 0 }}>
            Select a challenge to see its statement.
          </Text>
        ) : (
          <>
            <Box
              style={{
                padding: SPACING.md,
                borderRadius: RADIUS.lg,
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.surface,
              }}
            >
              <Flex gap={SPACING.sm} align="center" style={{ marginBottom: SPACING.sm } as React.CSSProperties}>
                <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: 0, flex: 1 }}>
                  {selected.title}
                </Text>
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
                  {selected.difficulty} · {selected.category}
                </Text>
              </Flex>

              <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: '0 0 0.75rem 0' }}>
                {selected.problemStatement}
              </Text>

              <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: SPACING.md } as React.CSSProperties}>
                <Detail label="Input format" value={selected.inputFormat} />
                <Detail label="Output format" value={selected.outputFormat} />
                <Detail
                  label="Constraints"
                  value={selected.constraints.map((constraint) => `• ${constraint}`).join('\n')}
                />
                <Detail
                  label="Expected complexity"
                  value={`Time ${selected.expectedComplexity?.time ?? '—'}\nSpace ${selected.expectedComplexity?.space ?? '—'}`}
                />
              </Box>

              {selected.sampleCases.length > 0 && (
                <Box style={{ marginTop: SPACING.md }}>
                  <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.35rem 0' }}>
                    Sample
                  </Text>
                  <Box
                    style={{
                      padding: SPACING.sm,
                      backgroundColor: '#0b1220',
                      borderRadius: RADIUS.sm,
                      fontFamily: '"SF Mono", Menlo, monospace',
                      fontSize: '0.74rem',
                      color: COLORS.textSecondary,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selected.sampleCases[0].input}
                    <span style={{ color: COLORS.textMuted }}>expected output:</span>
                    {selected.sampleCases[0].expectedOutput}
                  </Box>
                </Box>
              )}

              {selected.hints.length > 0 && (
                <Box style={{ marginTop: SPACING.md }}>
                  <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.35rem 0' }}>
                    Hints
                  </Text>
                  {selected.hints.map((hint, index) => (
                    <Text key={index} as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0 0 0.2rem 0' }}>
                      • {hint}
                    </Text>
                  ))}
                </Box>
              )}
            </Box>

            <Box>
              <Flex gap={SPACING.sm} align="center" style={{ marginBottom: SPACING.sm } as React.CSSProperties}>
                <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: 0, flex: 1 }}>
                  Your solution (C)
                </Text>
                <Button variant="primary" size="sm" onClick={onSubmit} disabled={isRunning}>
                  {isRunning ? 'Running the tests…' : 'Submit solution'}
                </Button>
                <Button variant="ghost" size="sm" onClick={onShowSolution}>
                  Show reference solution
                </Button>
              </Flex>
              <CodeEditor value={source} onChange={onSourceChange} />
            </Box>

            {feedback && (
              <Box
                style={{
                  padding: SPACING.md,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${
                    submission?.status === 'accepted' ? COLORS.success : COLORS.warning
                  }`,
                  backgroundColor:
                    submission?.status === 'accepted'
                      ? 'rgba(34, 197, 94, 0.1)'
                      : 'rgba(245, 158, 11, 0.1)',
                }}
              >
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
                  {feedback}
                </Text>
                {submission && (
                  <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: `${SPACING.xs} 0 0 0` }}>
                    {submission.passedTests} of {submission.totalTests} test cases passed
                    {submission.totalTests - submission.passedTests > 0
                      ? ` · ${submission.totalTests - submission.passedTests} hidden evaluation test(s) are still failing`
                      : ''}
                  </Text>
                )}
              </Box>
            )}

            {submission && submission.testResults.length > 0 && (
              <Box
                style={{
                  padding: SPACING.md,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.surface,
                }}
              >
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                  Test results
                </Text>
                <Box style={{ display: 'grid', gap: SPACING.xs }}>
                  {submission.testResults.map((test) => (
                    <Flex key={test.testCaseId} gap={SPACING.sm} align="center">
                      <Text
                        as="p"
                        style={{
                          ...TYPOGRAPHY.small,
                          color: test.passed ? COLORS.success : COLORS.error,
                          margin: 0,
                          minWidth: 60,
                        }}
                      >
                        {test.passed ? 'PASS' : 'FAIL'}
                      </Text>
                      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: 0, flex: 1 }}>
                        {test.hidden ? 'Hidden evaluation test' : 'Visible test'}
                        {test.detail ? ` — ${test.detail}` : ''}
                      </Text>
                      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
                        {test.durationMs} ms
                      </Text>
                    </Flex>
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

const Detail: FunctionComponent<{ label: string; value: string }> = ({ label, value }) => (
  <Box>
    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' }}>
      {label}
    </Text>
    <Text
      as="p"
      style={{
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
        margin: 0,
        whiteSpace: 'pre-wrap',
        fontSize: '0.76rem',
      }}
    >
      {value}
    </Text>
  </Box>
);
