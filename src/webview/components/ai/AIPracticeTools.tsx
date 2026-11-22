import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type {
  AIQuestionDraft,
  AIQuestionRequest,
} from '../../../core/ai/types';
import type { Recommendation } from '../../../core/ai/features/LearningAdvisor';

/**
 * The practice tools of the AI assistant.
 *
 * Everything here is optional: the question bank, the practicals and the
 * progress dashboard of Phase 6 keep working without an AI provider. The
 * tools simply let the student ask for more practice material and for a
 * learning plan built from their own recorded progress.
 */

const QUESTION_TYPES: Array<{ id: NonNullable<AIQuestionRequest['types']>[number]; label: string }> = [
  { id: 'mcq', label: 'Multiple choice' },
  { id: 'multiple-select', label: 'Multiple select' },
  { id: 'true-false', label: 'True / false' },
  { id: 'fill-blank', label: 'Fill in the blank' },
  { id: 'code-output', label: 'Predict the output' },
  { id: 'find-error', label: 'Find the error' },
  { id: 'complexity', label: 'Identify complexity' },
  { id: 'short-answer', label: 'Short answer' },
];

const DIFFICULTIES: Array<NonNullable<AIQuestionRequest['difficulty']>> = [
  'beginner',
  'intermediate',
  'advanced',
];

const VIVA_LEVELS = ['beginner', 'intermediate', 'advanced', 'mixed'] as const;

/** Generates additional practice questions and hands them to the review workflow. */
export const AIQuestionGeneratorForm: FunctionComponent<{
  onGenerate: (request: AIQuestionRequest) => void;
  disabled?: boolean;
}> = ({ onGenerate, disabled }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<NonNullable<AIQuestionRequest['difficulty']>>('intermediate');
  const [type, setType] = useState<AIQuestionDraft['type'] | ''>('mcq');
  const [count, setCount] = useState(5);

  return (
    <Box style={panelStyle}>
      <Text as="h3" style={titleStyle}>Practice question generator</Text>
      <Text as="p" style={hintStyle}>
        Generated questions stay drafts until you approve them — the verified
        question bank is never changed automatically.
      </Text>

      <Flex gap={SPACING.sm} wrap="wrap" align="end">
        <Field label="Topic">
          <input
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. dynamic programming"
            style={inputStyle}
          />
        </Field>

        <Field label="Difficulty">
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as NonNullable<AIQuestionRequest['difficulty']>)}
            style={selectStyle}
          >
            {DIFFICULTIES.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
        </Field>

        <Field label="Type">
          <select
            value={type}
            onChange={(event) => setType(event.target.value as AIQuestionDraft['type'] | '')}
            style={selectStyle}
          >
            <option value="">Any type</option>
            {QUESTION_TYPES.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.label}</option>
            ))}
          </select>
        </Field>

        <Field label="How many">
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (Number.isFinite(parsed)) {
                setCount(Math.min(20, Math.max(1, Math.round(parsed))));
              }
            }}
            style={{ ...inputStyle, width: '5rem' }}
          />
        </Field>

        <Button
          variant="primary"
          size="sm"
          disabled={disabled}
          onClick={() =>
            onGenerate({
              topic: topic.trim() || undefined,
              difficulty,
              count,
              types: type ? [type] : undefined,
            })
          }
        >
          Generate questions
        </Button>
      </Flex>
    </Box>
  );
};

/** Generates viva questions and starts a mock practical exam. */
export const AIVivaPrep: FunctionComponent<{
  onGenerate: (question: string) => void;
  disabled?: boolean;
}> = ({ onGenerate, disabled }) => {
  const [topic, setTopic] = useState('Greedy Algorithms');
  const [level, setLevel] = useState<(typeof VIVA_LEVELS)[number]>('mixed');

  return (
    <Box style={panelStyle}>
      <Text as="h3" style={titleStyle}>Viva preparation</Text>
      <Text as="p" style={hintStyle}>
        Questions are practice material generated for you — they are not
        official university examination questions.
      </Text>

      <Flex gap={SPACING.sm} wrap="wrap" align="end">
        <Field label="Topic">
          <input
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. sorting algorithms"
            style={inputStyle}
          />
        </Field>

        <Field label="Level">
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value as (typeof VIVA_LEVELS)[number])}
            style={selectStyle}
          >
            {VIVA_LEVELS.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
        </Field>

        <Button
          variant="primary"
          size="sm"
          disabled={disabled || !topic.trim()}
          onClick={() => onGenerate(`Generate ${level} viva questions on ${topic.trim()}.`)}
        >
          Generate viva questions
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || !topic.trim()}
          onClick={() => onGenerate(`Conduct a mock practical exam on ${topic.trim()}.`)}
        >
          Start a mock exam
        </Button>
      </Flex>
    </Box>
  );
};

/** The personalised learning plan, computed from the recorded progress. */
export const AILearningPlan: FunctionComponent<{
  plan?: {
    summary: string;
    recommendations: Recommendation[];
    roadmap: Recommendation[];
  };
  onLoad: () => void;
  disabled?: boolean;
}> = ({ plan, onLoad, disabled }) => (
  <Box style={panelStyle}>
    <Flex justify="between" align="center" gap={SPACING.sm} wrap="wrap">
      <Box>
        <Text as="h3" style={titleStyle}>My learning plan</Text>
        <Text as="p" style={hintStyle}>
          Recommendations use only your own recorded progress. Nothing is sent
          to a provider to build this plan.
        </Text>
      </Box>
      <Button variant="secondary" size="sm" onClick={onLoad} disabled={disabled}>
        {plan ? 'Refresh plan' : 'Build my plan'}
      </Button>
    </Flex>

    {plan && (
      <Box style={{ marginTop: SPACING.md }}>
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: `0 0 ${SPACING.sm} 0`, whiteSpace: 'pre-wrap' } as React.CSSProperties}>
          {plan.summary}
        </Text>

        {plan.recommendations.length > 0 ? (
          <Box>
            <Text as="p" style={sectionLabelStyle}>Recommended next</Text>
            {plan.recommendations.slice(0, 6).map((recommendation) => (
              <Flex key={recommendation.id} gap={SPACING.sm} align="start" style={{ marginBottom: SPACING.xs } as React.CSSProperties}>
                <Text as="span" style={{ color: COLORS.accent, fontSize: '0.8rem' } as React.CSSProperties}>▸</Text>
                <Box>
                  <Text as="span" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, fontWeight: 600 } as React.CSSProperties}>
                    {recommendation.title}
                  </Text>
                  <Text as="p" style={{ ...TYPOGRAPHY.small, fontSize: '0.78rem', color: COLORS.textMuted, margin: 0 } as React.CSSProperties}>
                    {recommendation.reason}
                  </Text>
                </Box>
              </Flex>
            ))}
          </Box>
        ) : (
          <Text as="p" style={hintStyle}>
            Answer a few questions or complete a practical to get recommendations.
          </Text>
        )}

        {plan.roadmap.length > 0 && (
          <Box style={{ marginTop: SPACING.sm }}>
            <Text as="p" style={sectionLabelStyle}>Suggested roadmap</Text>
            <Text as="p" style={{ ...TYPOGRAPHY.small, fontSize: '0.8rem', color: COLORS.textSecondary, margin: 0 } as React.CSSProperties}>
              {plan.roadmap.map((entry) => entry.title).join(' → ')}
            </Text>
          </Box>
        )}
      </Box>
    )}
  </Box>
);

const Field: FunctionComponent<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box>
    <label style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, display: 'block', marginBottom: '0.2rem', fontSize: '0.72rem' }}>
      {label}
    </label>
    {children}
  </Box>
);

const panelStyle: React.CSSProperties = {
  backgroundColor: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.lg,
  padding: SPACING.md,
  marginBottom: SPACING.md,
};

const titleStyle: React.CSSProperties = {
  ...TYPOGRAPHY.h4,
  color: COLORS.textPrimary,
  margin: 0,
  fontSize: '0.95rem',
};

const hintStyle: React.CSSProperties = {
  ...TYPOGRAPHY.small,
  color: COLORS.textMuted,
  fontSize: '0.78rem',
  margin: `0.2rem 0 ${SPACING.sm} 0`,
};

const sectionLabelStyle: React.CSSProperties = {
  ...TYPOGRAPHY.small,
  color: COLORS.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontSize: '0.68rem',
  margin: `0 0 ${SPACING.xs} 0`,
};

const inputStyle: React.CSSProperties = {
  backgroundColor: COLORS.surfaceElevated,
  color: COLORS.textPrimary,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.sm,
  padding: '0.35rem 0.5rem',
  fontSize: '0.82rem',
  minWidth: '10rem',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  minWidth: '8rem',
};
