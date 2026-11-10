import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';

type Props = {
  array: number[];
  target?: number;
  algorithm: string;
  onInputChange: (input: unknown) => void;
  onValidate: () => { valid: boolean; error?: string };
  onStart: (input: unknown) => void;
  isRunning: boolean;
  error?: string;
};

export const InputEditor: FunctionComponent<Props> = ({
  array,
  target,
  algorithm,
  onInputChange,
  onValidate,
  onStart,
  isRunning,
  error,
}) => {
  const [arrayText, setArrayText] = useState(array.join(', '));
  const [targetText, setTargetText] = useState(target !== undefined ? String(target) : '');
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  const isSearch = algorithm.includes('search');
  const needsSorted = algorithm === 'binary-search';

  const handleValidate = () => {
    const result = onValidate();
    setValidationError(result.error);
    return result.valid;
  };

  const handleStart = () => {
    const valid = handleValidate();
    if (!valid) {return;}

    let parsed: unknown;
    if (isSearch) {
      const t = Number(targetText);
      if (Number.isNaN(t)) {
        setValidationError('Target must be a valid number.');
        return;
      }
      const arr = arrayText
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n));
      if (arr.length === 0) {
        setValidationError('Array must contain at least one number.');
        return;
      }
      parsed = { array: arr, target: t };
    } else {
      const arr = arrayText
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n));
      if (arr.length === 0) {
        setValidationError('Array must contain at least one number.');
        return;
      }
      parsed = arr;
    }

    setValidationError(undefined);
    onInputChange(parsed);
    onStart(parsed);
  };

  const handleRandom = () => {
    const len = isSearch ? 8 : 12;
    const arr: number[] = [];
    for (let i = 0; i < len; i++) {
      arr.push(Math.floor(Math.random() * 90) + 10);
    }
    if (algorithm === 'binary-search') {
      arr.sort((a, b) => a - b);
    }
    setArrayText(arr.join(', '));
    onInputChange(arr);
  };

  const handleExample = () => {
    if (algorithm === 'bubble-sort') {
      setArrayText('64, 34, 25, 12, 22, 11, 90');
      onInputChange([64, 34, 25, 12, 22, 11, 90]);
    } else if (algorithm === 'selection-sort') {
      setArrayText('64, 25, 12, 22, 11');
      onInputChange([64, 25, 12, 22, 11]);
    } else if (algorithm === 'insertion-sort') {
      setArrayText('12, 11, 13, 5, 6');
      onInputChange([12, 11, 13, 5, 6]);
    } else if (algorithm === 'merge-sort') {
      setArrayText('38, 27, 43, 3, 9, 82, 10');
      onInputChange([38, 27, 43, 3, 9, 82, 10]);
    } else if (algorithm === 'quick-sort') {
      setArrayText('10, 7, 8, 9, 1, 5');
      onInputChange([10, 7, 8, 9, 1, 5]);
    } else if (algorithm === 'linear-search') {
      setArrayText('10, 20, 30, 40, 50');
      setTargetText('30');
      onInputChange({ array: [10, 20, 30, 40, 50], target: 30 });
    } else if (algorithm === 'binary-search') {
      setArrayText('10, 20, 30, 40, 50, 60, 70');
      setTargetText('40');
      onInputChange({ array: [10, 20, 30, 40, 50, 60, 70], target: 40 });
    }
    setValidationError(undefined);
  };

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      } as React.CSSProperties}
    >
      <Text
        as="h3"
        style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 1rem 0' } as React.CSSProperties}
      >
        Input Configuration
      </Text>

      <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: '0 0 0.75rem 0' } as React.CSSProperties}>
        Enter Array Elements
      </Text>
      <input
        type="text"
        value={arrayText}
        onChange={(e) => setArrayText((e.target as HTMLInputElement).value)}
        placeholder="e.g. 64, 34, 25, 12, 22, 11, 90"
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          backgroundColor: COLORS.surfaceElevated,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.md,
          color: COLORS.textPrimary,
          fontSize: '0.9375rem',
          fontFamily: 'monospace',
          outline: 'none',
        } as unknown as React.CSSProperties}
        disabled={isRunning}
      />

      {isSearch && (
        <Box style={{ marginTop: SPACING.md } as React.CSSProperties}>
          <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, margin: '0 0 0.5rem 0' } as React.CSSProperties}>
            Target Value
          </Text>
          <input
            type="text"
            value={targetText}
            onChange={(e) => setTargetText((e.target as HTMLInputElement).value)}
            placeholder="e.g. 30"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: COLORS.surfaceElevated,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.md,
              color: COLORS.textPrimary,
              fontSize: '0.9375rem',
              fontFamily: 'monospace',
              outline: 'none',
            } as unknown as React.CSSProperties}
            disabled={isRunning}
          />
        </Box>
      )}

      {needsSorted && (
        <Box
          style={{
            marginTop: SPACING.md,
            padding: SPACING.md,
            backgroundColor: '#fef3c720',
            border: '1px solid #f59e0b',
            borderRadius: RADIUS.md,
          } as React.CSSProperties}
        >
          <Text
            as="p"
            style={{
              ...TYPOGRAPHY.small,
              color: '#92400e',
              margin: 0,
              fontWeight: 500,
            } as React.CSSProperties}
          >
            ⚠ Binary Search requires a sorted array. Examples are pre-sorted.
          </Text>
        </Box>
      )}

      <Flex gap={SPACING.md} style={{ marginTop: SPACING.lg, flexWrap: 'wrap' } as React.CSSProperties}>
        <Button variant="secondary" onClick={handleRandom} disabled={isRunning}>
          Generate Random
        </Button>
        <Button variant="secondary" onClick={handleExample} disabled={isRunning}>
          Load Example
        </Button>
        <Button
          variant="primary"
          onClick={handleStart}
          disabled={isRunning}
          style={{ flex: '1 1 140px', minWidth: 140 } as React.CSSProperties}
        >
          Start Visualization
        </Button>
      </Flex>

      {validationError && (
        <Box
          style={{
            marginTop: SPACING.md,
            padding: SPACING.md,
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: RADIUS.md,
          } as React.CSSProperties}
        >
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.small, color: '#991b1b', margin: 0, fontWeight: 500 } as React.CSSProperties}
          >
            {validationError}
          </Text>
        </Box>
      )}
      {error && (
        <Box
          style={{
            marginTop: SPACING.md,
            padding: SPACING.md,
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: RADIUS.md,
          } as React.CSSProperties}
        >
          <Text
            as="p"
            style={{ ...TYPOGRAPHY.small, color: '#991b1b', margin: 0, fontWeight: 500 } as React.CSSProperties}
          >
            {error}
          </Text>
        </Box>
      )}
    </Box>
  );
};
