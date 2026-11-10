import type { ComparisonMode } from '../playground/types';

/**
 * Compares the output of a student program with the expected output.
 *
 * The comparison modes are explicit and never hide a meaningful difference:
 * - `exact`     — byte for byte identical
 * - `normalized`— identical after collapsing whitespace differences
 * - `numeric`   — identical after comparing numbers with a tolerance
 */

export interface ComparisonOutcome {
  passed: boolean;
  detail: string;
  /** Human readable differences (truncated by the caller when necessary). */
  diff: string[];
}

/** Collapses all whitespace runs into single spaces and trims the result. */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Splits text into tokens, keeping numbers recognisable. */
export function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

/**
 * Parses a token as a number. Supports integers, decimals and exponents.
 * Returns null when the token is not numeric.
 */
export function parseNumericToken(token: string): number | null {
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(token)) {
    return null;
  }
  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}

/** Compares two outputs using the selected mode. */
export function compareOutputs(
  actual: string,
  expected: string,
  mode: ComparisonMode,
  numericTolerance = 1e-6
): ComparisonOutcome {
  switch (mode) {
  case 'exact':
    return compareExact(actual, expected);
  case 'normalized':
    return compareNormalized(actual, expected);
  case 'numeric':
    return compareNumeric(actual, expected, numericTolerance);
  default:
    return {
      passed: false,
      detail: `Unknown comparison mode "${String(mode)}".`,
      diff: [],
    };
  }
}

function compareExact(actual: string, expected: string): ComparisonOutcome {
  if (actual === expected) {
    return { passed: true, detail: 'Output matches exactly.', diff: [] };
  }
  return {
    passed: false,
    detail: 'The output differs from the expected output.',
    diff: buildDiff(actual, expected),
  };
}

function compareNormalized(actual: string, expected: string): ComparisonOutcome {
  const normalizedActual = normalizeWhitespace(actual);
  const normalizedExpected = normalizeWhitespace(expected);

  if (normalizedActual === normalizedExpected) {
    return {
      passed: true,
      detail: 'Output matches after whitespace normalisation.',
      diff: [],
    };
  }
  return {
    passed: false,
    detail: 'The output differs from the expected output even after whitespace normalisation.',
    diff: buildDiff(normalizedActual, normalizedExpected),
  };
}

function compareNumeric(
  actual: string,
  expected: string,
  tolerance: number
): ComparisonOutcome {
  const actualTokens = tokenize(actual);
  const expectedTokens = tokenize(expected);

  if (actualTokens.length !== expectedTokens.length) {
    const expectedCount = expectedTokens.length;
    const actualCount = actualTokens.length;
    return {
      passed: false,
      detail: `Expected ${expectedCount} value${expectedCount === 1 ? '' : 's'} but the program printed ${actualCount}.`,
      diff: buildDiff(actual, expected),
    };
  }

  const diff: string[] = [];
  for (let i = 0; i < expectedTokens.length; i++) {
    const expectedValue = parseNumericToken(expectedTokens[i]);
    const actualValue = parseNumericToken(actualTokens[i]);

    if (expectedValue === null || actualValue === null) {
      if (actualTokens[i] !== expectedTokens[i]) {
        diff.push(`[${i}] expected "${expectedTokens[i]}" but got "${actualTokens[i]}"`);
      }
      continue;
    }

    if (Math.abs(expectedValue - actualValue) > tolerance) {
      diff.push(
        `[${i}] expected ${expectedValue} but got ${actualValue} (difference ${Math.abs(
          expectedValue - actualValue
        ).toExponential(3)} > tolerance ${tolerance})`
      );
    }
  }

  if (diff.length === 0) {
    return {
      passed: true,
      detail: `Output matches numerically within a tolerance of ${tolerance}.`,
      diff: [],
    };
  }

  return {
    passed: false,
    detail: `${diff.length} value${diff.length === 1 ? '' : 's'} differ${diff.length === 1 ? 's' : ''} from the expected output.`,
    diff,
  };
}

/** Builds a compact, line based difference description. */
export function buildDiff(actual: string, expected: string, maxLines = 20): string[] {
  const actualLines = actual.split(/\r?\n/);
  const expectedLines = expected.split(/\r?\n/);
  const diff: string[] = [];
  const max = Math.max(actualLines.length, expectedLines.length);

  for (let i = 0; i < max && diff.length < maxLines; i++) {
    const a = actualLines[i];
    const e = expectedLines[i];
    if (a !== e) {
      diff.push(`line ${i + 1}: expected ${JSON.stringify(e ?? '')} but got ${JSON.stringify(a ?? '')}`);
    }
  }

  if (actualLines.length !== expectedLines.length) {
    diff.push(
      `line count differs: expected ${expectedLines.length} line(s) but got ${actualLines.length} line(s)`
    );
  }

  return diff;
}
