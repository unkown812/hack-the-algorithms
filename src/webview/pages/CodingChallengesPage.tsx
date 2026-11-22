import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Box, Flex, Text, Button } from '../components/primitives';
import { COLORS, SPACING, TYPOGRAPHY } from '../Theme';
import { PRACTICE_MESSAGES } from '../../shared/constants';
import { practiceApi, usePracticeMessages } from '../hooks/usePractice';
import { ChallengeExplorer } from '../components/challenges/ChallengeExplorer';
import type { ChallengeSubmission, CodingChallenge } from '../../core/practice/types';

interface CodingChallengesPageProps {
  /** The challenge that should be opened directly (optional). */
  challengeId?: string;
  onBack: () => void;
}

/**
 * The coding challenge platform. The editor and the execution come from the
 * Phase 5 playground — there is no second code editor.
 */
export const CodingChallengesPage: FunctionComponent<CodingChallengesPageProps> = ({
  challengeId,
  onBack,
}) => {
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [selected, setSelected] = useState<CodingChallenge | null>(null);
  const [source, setSource] = useState('');
  const [submission, setSubmission] = useState<ChallengeSubmission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  usePracticeMessages(
    useCallback((type, payload) => {
      switch (type) {
      case PRACTICE_MESSAGES.CHALLENGES_LOADED:
        setChallenges((payload.challenges as CodingChallenge[]) ?? []);
        break;
      case PRACTICE_MESSAGES.CHALLENGE_LOADED: {
        const challenge = payload.challenge as CodingChallenge | undefined;
        if (challenge) {
          setSelected(challenge);
        }
        if (payload.referenceSolution) {
          setSource(String(payload.referenceSolution));
        }
        break;
      }
      case PRACTICE_MESSAGES.CHALLENGE_RESULT: {
        if (payload.submission) {
          setSubmission(payload.submission as ChallengeSubmission);
          setFeedback(String(payload.feedback ?? ''));
        }
        setIsRunning(false);
        break;
      }
      default:
        break;
      }
    }, [])
  );

  useEffect(() => {
    practiceApi.getChallenges();
  }, []);

  useEffect(() => {
    if (challengeId) {
      practiceApi.getChallenge(challengeId);
    }
  }, [challengeId]);

  const selectChallenge = (id: string): void => {
    setSubmission(null);
    setFeedback('');
    setSource('');
    practiceApi.getChallenge(id);
  };

  return (
    <Box style={{ padding: SPACING.lg }}>
      <Flex gap={SPACING.md} align="center" justify="between" style={{ marginBottom: SPACING.lg } as React.CSSProperties}>
        <Box>
          <Text as="h1" style={{ ...TYPOGRAPHY.h1, color: COLORS.textPrimary, margin: 0 }}>
            Coding challenges
          </Text>
          <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: '0.25rem 0 0 0' }}>
            Your solution is compiled and executed locally with the same GCC toolchain as the Code Playground. A solution
            is only accepted when every test case passes.
          </Text>
        </Box>
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </Flex>

      <ChallengeExplorer
        challenges={challenges}
        selected={selected}
        onSelect={selectChallenge}
        source={source}
        onSourceChange={setSource}
        onSubmit={() => {
          if (!selected) {
            return;
          }
          setIsRunning(true);
          setFeedback('');
          practiceApi.submitChallenge(selected.id, source);
        }}
        onShowSolution={() => {
          if (selected) {
            practiceApi.getReferenceSolution(selected.id);
          }
        }}
        submission={submission}
        feedback={feedback}
        isRunning={isRunning}
      />
    </Box>
  );
};
