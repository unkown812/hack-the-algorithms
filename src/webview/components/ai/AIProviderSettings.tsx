import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type {
  AIProviderConfig,
  AIProviderStatus,
  ExplanationMode,
} from '../../../core/ai/types';
import { EXPLANATION_MODES } from '../../../core/ai/types';

/** The explanation-mode selector — switches modes without losing the chat. */
export const AIModeSelector: FunctionComponent<{
  mode: ExplanationMode;
  onChange: (mode: ExplanationMode) => void;
}> = ({ mode, onChange }) => (
  <Flex wrap="wrap" gap={SPACING.xs} style={{ marginBottom: SPACING.md }}>
    {EXPLANATION_MODES.map((entry) => (
      <Box
        key={entry.id}
        onClick={() => onChange(entry.id)}
        title={entry.description}
        style={{
          cursor: 'pointer',
          backgroundColor: entry.id === mode ? COLORS.accent : COLORS.surface,
          color: entry.id === mode ? '#ffffff' : COLORS.textSecondary,
          border: `1px solid ${entry.id === mode ? COLORS.accent : COLORS.border}`,
          borderRadius: RADIUS.xl,
          padding: '0.25rem 0.7rem',
          fontSize: '0.78rem',
        } as React.CSSProperties}
      >
        {entry.label}
      </Box>
    ))}
  </Flex>
);

/** The provider and credential settings. */
export const AIProviderSettings: FunctionComponent<{
  statuses: AIProviderStatus[];
  config: AIProviderConfig | null;
  onSaveConfig: (changes: Partial<AIProviderConfig>) => void;
  onSaveKey: (provider: string, key: string) => void;
  onClearKey: (provider: string) => void;
  onTest: () => void;
  testResult?: { ok: boolean; message: string } | null;
  onClose: () => void;
}> = ({ statuses, config, onSaveConfig, onSaveKey, onClearKey, onTest, testResult, onClose }) => {
  const [keyDraft, setKeyDraft] = useState('');

  if (!config) {
    return null;
  }

  const external = statuses.find((status) => status.id === config.provider)?.isExternal ?? false;
  const activeStatus = statuses.find((status) => status.id === config.provider);

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
      } as React.CSSProperties}
    >
      <Flex justify="between" align="center" style={{ marginBottom: SPACING.md }}>
        <Text as="h3" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: 0 } as React.CSSProperties}>
          AI Settings
        </Text>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </Flex>

      <label style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, display: 'block', marginBottom: '0.25rem' }}>
        Provider
      </label>
      <select
        value={config.provider}
        onChange={(event) => onSaveConfig({ provider: event.target.value as AIProviderConfig['provider'] })}
        style={selectStyle}
      >
        {statuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.name}
            {status.isExternal ? ' (external service)' : ' (offline)'}
          </option>
        ))}
      </select>

      {activeStatus && (
        <Text as="p" style={{ ...TYPOGRAPHY.small, fontSize: '0.75rem', color: COLORS.textMuted, margin: `${SPACING.xs} 0 0 0` } as React.CSSProperties}>
          {activeStatus.supportsStreaming
            ? 'This provider delivers the answer piece by piece.'
            : 'This provider delivers the complete answer at once.'}
          {activeStatus.endpoint ? ` Server: ${activeStatus.endpoint}.` : ''}
        </Text>
      )}

      <label style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, display: 'block', margin: `${SPACING.md} 0 0.25rem 0` }}>
        Model
      </label>
      <select
        value={config.model}
        onChange={(event) => onSaveConfig({ model: event.target.value })}
        style={selectStyle}
      >
        <option value="">Default model</option>
        {(statuses.find((status) => status.id === config.provider)?.models ?? []).map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>

      {external && (
        <>
          <label style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, display: 'block', margin: `${SPACING.md} 0 0.25rem 0` }}>
            API key — stored in the VS Code secret storage, never sent to the webview
          </label>
          <Flex gap={SPACING.xs}>
            <input
              type="password"
              placeholder={
                statuses.find((status) => status.id === config.provider)?.hasKey
                  ? 'A key is stored — paste to replace'
                  : 'Paste your API key'
              }
              value={keyDraft}
              onChange={(event) => setKeyDraft(event.target.value)}
              style={inputStyle}
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!keyDraft.trim()}
              onClick={() => {
                onSaveKey(config.provider, keyDraft.trim());
                setKeyDraft('');
              }}
            >
              Save key
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!statuses.find((status) => status.id === config.provider)?.hasKey}
              onClick={() => onClearKey(config.provider)}
            >
              Remove
            </Button>
          </Flex>

          <label style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, display: 'flex', gap: '0.5rem', alignItems: 'center', margin: `${SPACING.md} 0 0.25rem 0`, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={config.allowExternalContext}
              onChange={(event) => onSaveConfig({ allowExternalContext: event.target.checked })}
            />
            Allow the selected context (code, results, progress) to be sent to the provider
          </label>
          <Text as="p" style={{ ...TYPOGRAPHY.small, fontSize: '0.75rem', color: COLORS.warning, margin: 0 }}>
            Without this consent only the bundled learning material leaves the machine — never your code or your progress data.
          </Text>
        </>
      )}

      <Flex gap={SPACING.lg} wrap="wrap" style={{ marginTop: SPACING.md }}>
        <NumberField
          label="Temperature"
          value={config.temperature}
          step={0.1}
          min={0}
          max={2}
          onChange={(value) => onSaveConfig({ temperature: value })}
        />
        <NumberField
          label="Max tokens"
          value={config.maxTokens}
          step={100}
          min={64}
          max={32000}
          onChange={(value) => onSaveConfig({ maxTokens: value })}
        />
        <NumberField
          label="Timeout (s)"
          value={config.timeoutMs / 1000}
          step={5}
          min={1}
          max={300}
          onChange={(value) => onSaveConfig({ timeoutMs: value * 1000 })}
        />
        <NumberField
          label="Conversation messages"
          value={config.maxContextMessages}
          step={1}
          min={1}
          max={50}
          onChange={(value) => onSaveConfig({ maxContextMessages: value })}
        />
        <NumberField
          label="Context characters"
          value={config.maxContextCharacters}
          step={1000}
          min={500}
          max={100000}
          onChange={(value) => onSaveConfig({ maxContextCharacters: value })}
        />
      </Flex>

      <label style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, display: 'flex', gap: '0.5rem', alignItems: 'center', margin: `${SPACING.md} 0 0.25rem 0`, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={config.streaming}
          onChange={(event) => onSaveConfig({ streaming: event.target.checked })}
        />
        Deliver the answer piece by piece when the provider supports streaming
      </label>

      <label style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, display: 'flex', gap: '0.5rem', alignItems: 'center', margin: `${SPACING.xs} 0 0.25rem 0`, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={config.useLocalResources}
          onChange={(event) => onSaveConfig({ useLocalResources: event.target.checked })}
        />
        Include the bundled verified learning resources in the answer
      </label>

      {config.provider === 'local-llm' && (
        <>
          <label style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, display: 'block', margin: `${SPACING.md} 0 0.25rem 0` }}>
            Address of the local model server
          </label>
          <input
            type="text"
            value={config.localBaseUrl}
            onChange={(event) => onSaveConfig({ localBaseUrl: event.target.value })}
            placeholder="http://localhost:11434"
            style={inputStyle}
          />
          <Text as="p" style={{ ...TYPOGRAPHY.small, fontSize: '0.75rem', color: COLORS.textMuted, margin: `${SPACING.xs} 0 0 0` }}>
            The models are read from the server when it is running — for example "ollama serve" with "ollama pull llama3.2".
            The request never leaves your machine.
          </Text>
        </>
      )}

      <Flex gap={SPACING.sm} align="center" style={{ marginTop: SPACING.md }}>
        <Button variant="secondary" size="sm" onClick={onTest}>
          Test connection
        </Button>
        {testResult && (
          <Text
            as="span"
            style={{
              ...TYPOGRAPHY.small,
              fontSize: '0.8rem',
              color: testResult.ok ? COLORS.success : COLORS.error,
            } as React.CSSProperties}
          >
            {testResult.message}
          </Text>
        )}
      </Flex>
    </Box>
  );
};

const NumberField: FunctionComponent<{
  label: string;
  value: number;
  step: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}> = ({ label, value, step, min, max, onChange }) => (
  <Box>
    <label style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, display: 'block', marginBottom: '0.2rem', fontSize: '0.75rem' }}>
      {label}
    </label>
    <input
      type="number"
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={(event) => {
        const parsed = Number(event.target.value);
        if (Number.isFinite(parsed)) {
          onChange(Math.min(max, Math.max(min, parsed)));
        }
      }}
      style={{ ...inputStyle, width: '7rem' }}
    />
  </Box>
);

/** The entry cards of the empty chat — Algorithm Tutor, Code Explainer, etc. */
export const AIQuickActions: FunctionComponent<{
  onPick: (task: string, text: string) => void;
}> = ({ onPick }) => {
  const actions: Array<{ task: string; text: string; title: string; description: string }> = [
    { task: 'algorithm-explanation', text: 'Explain an algorithm.', title: 'Algorithm Tutor', description: 'Theory, pseudocode, implementation and complexity from the verified registry.' },
    { task: 'code-explanation', text: 'Explain my code.', title: 'Code Explainer', description: 'Understand selected C code, line by line, with a dry run.' },
    { task: 'debugging', text: 'Help me debug my program.', title: 'Debugging Assistant', description: 'Explanations built on real compiler diagnostics and execution results.' },
    { task: 'complexity', text: 'Explain this complexity.', title: 'Complexity Tutor', description: 'Recurrences, dominant terms and the difference between theory and measurement.' },
    { task: 'visualization', text: 'Explain the current visualization step.', title: 'Visualization Assistant', description: 'Interpret the step of the trace you are looking at.' },
    { task: 'practical', text: 'Help me prepare for the practical exam.', title: 'Practical & Viva', description: 'Practical papers, viva questions and mock exam practice.' },
  ];

  return (
    <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: SPACING.sm }}>
      {actions.map((action) => (
        <Box
          key={action.title}
          onClick={() => onPick(action.task, action.text)}
          style={{
            cursor: 'pointer',
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
          } as React.CSSProperties}
        >
          <Text as="p" style={{ ...TYPOGRAPHY.h4, fontSize: '0.9rem', color: COLORS.textPrimary, margin: `0 0 ${SPACING.xs} 0`, fontWeight: 600 } as React.CSSProperties}>
            {action.title}
          </Text>
          <Text as="p" style={{ ...TYPOGRAPHY.small, fontSize: '0.78rem', color: COLORS.textMuted, margin: 0 } as React.CSSProperties}>
            {action.description}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: COLORS.surfaceElevated,
  color: COLORS.textPrimary,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.sm,
  padding: '0.4rem 0.5rem',
  fontSize: '0.85rem',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: COLORS.surfaceElevated,
  color: COLORS.textPrimary,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.sm,
  padding: '0.4rem 0.5rem',
  fontSize: '0.85rem',
};
