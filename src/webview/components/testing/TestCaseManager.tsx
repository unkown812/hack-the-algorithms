import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { ComparisonMode, TestCase } from '../../../core/playground/types';

interface TestCaseManagerProps {
  testCases: TestCase[];
  onChange: (testCases: TestCase[]) => void;
  onRunAll: () => void;
}

const COMPARISON_LABELS: Record<ComparisonMode, string> = {
  exact: 'Exact match',
  normalized: 'Ignore whitespace differences',
  numeric: 'Numeric with tolerance',
};

/**
 * Create, edit and remove the test cases of a program.
 */
export const TestCaseManager: FunctionComponent<TestCaseManagerProps> = ({
  testCases,
  onChange,
  onRunAll,
}) => {
  const [name, setName] = useState('');
  const [input, setInput] = useState('');
  const [expected, setExpected] = useState('');
  const [mode, setMode] = useState<ComparisonMode>('normalized');

  const addTestCase = (): void => {
    const testCase: TestCase = {
      id: `test-${Date.now().toString(36)}`,
      name: name.trim() || `Test ${testCases.length + 1}`,
      input,
      expectedOutput: expected,
      comparisonMode: mode,
    };
    onChange([...testCases, testCase]);
    setName('');
    setInput('');
    setExpected('');
  };

  const updateTestCase = (id: string, changes: Partial<TestCase>): void => {
    onChange(testCases.map((testCase) => (testCase.id === id ? { ...testCase, ...changes } : testCase)));
  };

  const removeTestCase = (id: string): void => {
    onChange(testCases.filter((testCase) => testCase.id !== id));
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.4rem 0.5rem',
    backgroundColor: '#0b1220',
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.sm,
    color: COLORS.textPrimary,
    fontFamily: '"SF Mono", Menlo, monospace',
    fontSize: '0.75rem',
  };

  return (
    <Box style={{ display: 'grid', gap: SPACING.md }}>
      <Box
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
        }}
      >
        <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: '0 0 0.75rem 0' }}>
          New test case
        </Text>
        <Box style={{ display: 'grid', gap: SPACING.sm }}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Test name (optional)"
            style={fieldStyle}
          />
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={'Standard input, e.g.\n5\n5 4 3 2 1'}
            style={{ ...fieldStyle, minHeight: 70 }}
          />
          <textarea
            value={expected}
            onChange={(event) => setExpected(event.target.value)}
            placeholder={'Expected output, e.g.\n1 2 3 4 5'}
            style={{ ...fieldStyle, minHeight: 60 }}
          />
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as ComparisonMode)}
            style={fieldStyle}
          >
            {(Object.keys(COMPARISON_LABELS) as ComparisonMode[]).map((key) => (
              <option key={key} value={key}>
                {COMPARISON_LABELS[key]}
              </option>
            ))}
          </select>
          <Flex justify="flex-end">
            <Button variant="primary" size="sm" onClick={addTestCase}>
              Add test case
            </Button>
          </Flex>
        </Box>
      </Box>

      <Box
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
        }}
      >
        <Flex gap={SPACING.sm} align="center" justify="between" style={{ marginBottom: SPACING.sm } as React.CSSProperties}>
          <Text as="h4" style={{ ...TYPOGRAPHY.h4, color: COLORS.textPrimary, margin: 0 }}>
            Test cases ({testCases.length})
          </Text>
          <Button variant="secondary" size="sm" onClick={onRunAll} disabled={testCases.length === 0}>
            Run all tests
          </Button>
        </Flex>

        {testCases.length === 0 ? (
          <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
            No test cases yet. Add one above to check the program against a known input and output.
          </Text>
        ) : (
          <Box style={{ display: 'grid', gap: SPACING.sm }}>
            {testCases.map((testCase) => (
              <Box
                key={testCase.id}
                style={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.sm,
                  padding: SPACING.sm,
                  backgroundColor: COLORS.surfaceElevated,
                }}
              >
                <Flex gap={SPACING.sm} align="center" style={{ marginBottom: SPACING.xs } as React.CSSProperties}>
                  <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
                    {testCase.name}
                  </Text>
                  <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0, fontSize: '0.72rem' }}>
                    {COMPARISON_LABELS[testCase.comparisonMode]}
                  </Text>
                  <span style={{ flex: 1 }} />
                  <Button variant="ghost" size="sm" onClick={() => removeTestCase(testCase.id)}>
                    Remove
                  </Button>
                </Flex>

                <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING.sm }}>
                  <Box>
                    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' }}>
                      Input
                    </Text>
                    <textarea
                      value={testCase.input}
                      onChange={(event) => updateTestCase(testCase.id, { input: event.target.value })}
                      style={{ ...fieldStyle, minHeight: 60 }}
                    />
                  </Box>
                  <Box>
                    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 0.25rem 0' }}>
                      Expected output
                    </Text>
                    <textarea
                      value={testCase.expectedOutput}
                      onChange={(event) =>
                        updateTestCase(testCase.id, { expectedOutput: event.target.value })
                      }
                      style={{ ...fieldStyle, minHeight: 60 }}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};
