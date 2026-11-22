import type { FunctionComponent } from 'react';
import { useCallback, useRef, useState } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import { AIMarkdown } from './AIMarkdown';
import { aiApi, useAIMessages } from '../../hooks/useAI';
import { VisualizationAssistant } from '../../../core/ai/features/VisualizationAssistant';
import type { Algorithm } from '../../../core/algorithms';
import type { ExecutionStep } from '../../../core/visualization/types';
import type { ContextSelection } from '../../../core/ai/AIContextBuilder';

/**
 * The assistant next to the visualization.
 *
 * Two kinds of input are supported:
 *
 * - a **playback command** ("move to the next comparison") is translated into
 *   the existing controls of the visualizer — no provider is contacted and the
 *   trace is never modified by the assistant,
 * - a **question** is sent to the AI service together with the current step of
 *   the trace, so the student does not have to describe what they see.
 */
export const AIVisualizationAssistant: FunctionComponent<{
  algorithm: Algorithm;
  step?: ExecutionStep;
  stepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onRestart: () => void;
  onFirst: () => void;
  onLast: () => void;
  onPlay: () => void;
  onPause: () => void;
}> = ({
  algorithm,
  step,
  stepIndex,
  totalSteps,
  isPlaying,
  onNext,
  onPrevious,
  onRestart,
  onFirst,
  onLast,
  onPlay,
  onPause,
}) => {
  const assistant = useRef(new VisualizationAssistant()).current;
  const [draft, setDraft] = useState('');
  const [answer, setAnswer] = useState('');
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const [warning, setWarning] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const requestRef = useRef<string | undefined>(undefined);
  const conversationRef = useRef<string | undefined>(undefined);

  useAIMessages(
    useCallback((type, payload) => {
      const requestId = String(payload.requestId ?? '');
      if (!requestRef.current || requestId !== requestRef.current) {
        return;
      }

      switch (type) {
      case 'AI_CHUNK': {
        const text = String(payload.text ?? '');
        if (text) {
          setAnswer((previous) => previous + text);
        }
        break;
      }
      case 'AI_RESPONSE': {
        const response = payload.response as { content?: string } | undefined;
        if (response?.content) {
          setAnswer(response.content);
        }
        // Keep follow-up questions in the same conversation. The host creates
        // one lazily with the first question, so opening the visualizer does
        // not leave an empty conversation behind.
        conversationRef.current =
          String(payload.conversationId ?? '') || conversationRef.current;
        if (payload.contextWithheld === true) {
          setWarning(
            'The provider is external and context sharing is off, so the current step was not sent with your question. Enable the consent in the assistant settings to include it.'
          );
        }
        setBusy(false);
        requestRef.current = undefined;
        break;
      }
      case 'AI_ERROR': {
        setError(String(payload.message ?? 'The assistant could not answer.'));
        setBusy(false);
        requestRef.current = undefined;
        break;
      }
      default:
        break;
      }
    }, [])
  );

  const buildSelection = (): ContextSelection => {
    if (!step) {
      return { algorithmId: algorithm.id };
    }

    return {
      algorithmId: algorithm.id,
      visualization: {
        algorithmId: algorithm.id,
        stepIndex,
        description: step.description,
        explanation: step.explanation,
        operation: step.operation,
        lineNumber: step.lineNumber,
        array: step.currentState.array
          ? {
            values: step.currentState.array.values,
            comparedIndices: step.comparedElements,
            swappedIndices: step.swappedElements,
          }
          : undefined,
        variables: { ...step.currentState.variables, ...(step.variables ?? {}) },
      },
    };
  };

  const submit = (text: string): void => {
    const question = text.trim();
    if (!question || busy) {
      return;
    }

    setError(undefined);
    setNotice(undefined);
    setWarning(undefined);

    // A playback command never needs a provider — it uses the existing controls.
    const command = assistant.parseCommand(question);
    if (command.type !== 'none') {
      switch (command.type) {
      case 'next':
        onNext();
        setNotice('Moved to the next step.');
        break;
      case 'previous':
        onPrevious();
        setNotice('Moved to the previous step.');
        break;
      case 'first':
        onFirst();
        setNotice('Jumped to the first step.');
        break;
      case 'last':
        onLast();
        setNotice('Jumped to the last step.');
        break;
      case 'restart':
        onRestart();
        setNotice('Restarted the visualization.');
        break;
      case 'play':
        onPlay();
        setNotice('Playback started.');
        break;
      case 'pause':
        onPause();
        setNotice('Playback paused.');
        break;
      default:
        break;
      }
      setDraft('');
      return;
    }

    const requestId = `viz-${Date.now()}`;
    requestRef.current = requestId;
    setBusy(true);
    setAnswer('');
    setDraft('');

    aiApi.ask({
      question,
      mode: 'beginner',
      task: 'visualization',
      requestId,
      conversationId: conversationRef.current,
      selection: buildSelection(),
    });
  };

  return (
    <Box style={panelStyle}>
      <Flex justify="between" align="center" wrap="wrap" gap={SPACING.sm}>
        <Box>
          <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: 0, fontSize: '1rem' } as React.CSSProperties}>
            Ask about this step
          </Text>
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0.2rem 0 0 0', fontSize: '0.78rem' } as React.CSSProperties}>
            {step
              ? `Step ${stepIndex + 1} of ${totalSteps} · ${step.operation} — the current trace is attached to your question.`
              : 'Start the visualization to attach the current step to your question.'}
          </Text>
        </Box>
        {busy && (
          <Button variant="danger" size="sm" onClick={() => requestRef.current && aiApi.cancel(requestRef.current)}>
            Stop
          </Button>
        )}
      </Flex>

      <Flex gap={SPACING.xs} wrap="wrap" style={{ marginTop: SPACING.sm } as React.CSSProperties}>
        {[
          'Explain the current step.',
          'Why was this element selected?',
          'What happens next?',
          'Move to the next comparison.',
        ].map((suggestion) => (
          <Box
            key={suggestion}
            onClick={() => submit(suggestion)}
            style={chipStyle}
          >
            {suggestion}
          </Box>
        ))}
      </Flex>

      <Flex gap={SPACING.sm} align="end" style={{ marginTop: SPACING.sm } as React.CSSProperties}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit(draft);
            }
          }}
          placeholder="Ask about the step, or type “next”, “previous”, “restart”…"
          style={inputStyle}
        />
        <Button variant="primary" size="sm" onClick={() => submit(draft)} disabled={busy || !draft.trim()}>
          Ask
        </Button>
      </Flex>

      {notice && (
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.success, margin: `${SPACING.sm} 0 0 0`, fontSize: '0.8rem' } as React.CSSProperties}>
          {notice}
        </Text>
      )}

      {isPlaying && (
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: `${SPACING.xs} 0 0 0`, fontSize: '0.75rem' } as React.CSSProperties}>
          Playback is running — pause it if you want to ask about a single step.
        </Text>
      )}

      {warning && (
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.warning, margin: `${SPACING.sm} 0 0 0`, fontSize: '0.8rem' } as React.CSSProperties}>
          {warning}
        </Text>
      )}

      {error && (
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.error, margin: `${SPACING.sm} 0 0 0`, fontSize: '0.8rem' } as React.CSSProperties}>
          {error}
        </Text>
      )}

      {(answer || (busy && !answer)) && (
        <Box style={{ marginTop: SPACING.md, borderTop: `1px solid ${COLORS.border}`, paddingTop: SPACING.sm } as React.CSSProperties}>
          {answer ? (
            <AIMarkdown content={answer} />
          ) : (
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 } as React.CSSProperties}>
              Reading the current step…
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};

const panelStyle: React.CSSProperties = {
  backgroundColor: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.lg,
  padding: SPACING.lg,
  marginTop: SPACING.lg,
};

const chipStyle: React.CSSProperties = {
  cursor: 'pointer',
  backgroundColor: COLORS.surfaceElevated,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.xl,
  padding: '0.2rem 0.6rem',
  color: COLORS.textSecondary,
  fontSize: '0.76rem',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: COLORS.surfaceElevated,
  color: COLORS.textPrimary,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.sm,
  padding: '0.45rem 0.6rem',
  fontSize: '0.85rem',
};
