import type { ExecutionStep } from '../visualization/types';

/**
 * Maps lines of the student's C source onto algorithm roles.
 *
 * GDB reports which line is executing; it does not report "this was a
 * comparison" or "this was a swap". For the supported algorithms the roles are
 * derived from the actual source text, so the counts stay honest: when a
 * pattern cannot be recognised the caller is told that the information is
 * unavailable instead of receiving invented numbers.
 */

export type SourceRole =
  | 'comparison'
  | 'swap'
  | 'loop-iteration'
  | 'array-write'
  | 'function-call'
  | 'other';

export interface SourceLineRole {
  line: number;
  role: SourceRole;
  /** The statement that produced the role. */
  text: string;
}

export interface SourceMap {
  algorithmId: string | null;
  /** Line number → role. */
  lines: Map<number, SourceRole>;
  /** Name of the array variable the algorithm works on, when recognised. */
  arrayName: string | null;
  /** Name of the loop counter(s), when recognised. */
  counterNames: string[];
  /** True when the source could be mapped onto the algorithm. */
  recognised: boolean;
  note: string;
}

/** Removes comments and string literals so patterns are not matched inside text. */
export function stripCommentsAndStrings(source: string): string {
  let result = '';
  let index = 0;
  let inLineComment = false;
  let inBlockComment = false;
  let inString: '"' | '\'' | null = null;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
        result += char;
      }
      index += 1;
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        index += 2;
        continue;
      }
      if (char === '\n') {
        result += char;
      }
      index += 1;
      continue;
    }

    if (inString) {
      if (char === '\\') {
        index += 2;
        continue;
      }
      if (char === inString) {
        inString = null;
      }
      index += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      index += 2;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      index += 2;
      continue;
    }
    if (char === '"' || char === '\'') {
      inString = char;
      index += 1;
      continue;
    }

    result += char;
    index += 1;
  }

  return result;
}

interface AlgorithmPattern {
  algorithmId: string;
  /** Matches a comparison between two array elements. */
  comparison?: RegExp;
  /** Matches a statement that exchanges two array elements. */
  swap?: RegExp;
  /** Matches the loop that drives the algorithm. */
  loop?: RegExp;
  /** Matches the array the algorithm operates on. */
  array?: RegExp;
}

const PATTERNS: AlgorithmPattern[] = [
  {
    algorithmId: 'bubble-sort',
    comparison: /\b(\w+)\s*\[\s*(\w+)\s*(?:\+\s*1)?\s*\]\s*[<>]=?|[<>]=?\s*\b(\w+)\s*\[\s*(\w+)\s*(?:\+\s*1)?\s*\]/,
    swap: /\btemp\b/,
    loop: /\bfor\s*\(/,
    array: /\b(\w+)\s*\[\s*\w+\s*\]\s*=\s*\{/,
  },
  {
    algorithmId: 'selection-sort',
    comparison: /\b(\w+)\s*\[\s*(\w+)\s*\]\s*<|\bmin(Index)?\b/,
    swap: /\btemp\b/,
    loop: /\bfor\s*\(/,
    array: /\b(\w+)\s*\[\s*\w+\s*\]\s*=\s*\{/,
  },
  {
    algorithmId: 'insertion-sort',
    comparison: /\b(\w+)\s*\[\s*(\w+)\s*\]\s*>|\bkey\b/,
    swap: /\bkey\b/,
    loop: /\bfor\s*\(/,
    array: /\b(\w+)\s*\[\s*\w+\s*\]\s*=\s*\{/,
  },
  {
    algorithmId: 'merge-sort',
    comparison: /<=|>=|\bmid\b/,
    swap: /\b(left|right|temp)\b/,
    loop: /\bfor\s*\(|\bwhile\s*\(/,
    array: /\b(\w+)\s*\[\s*\w+\s*\]\s*=\s*\{/,
  },
  {
    algorithmId: 'quick-sort',
    comparison: /<=|\bpartition\b|\bpivot\b/,
    swap: /\btemp\b|\bpartition\b/,
    loop: /\bfor\s*\(/,
    array: /\b(\w+)\s*\[\s*\w+\s*\]\s*=\s*\{/,
  },
  {
    algorithmId: 'linear-search',
    comparison: /==/,
    swap: undefined,
    loop: /\bfor\s*\(/,
    array: /\b(\w+)\s*\[\s*\w+\s*\]\s*=\s*\{/,
  },
  {
    algorithmId: 'binary-search',
    comparison: /==|<=|<|>\bmid\b/,
    swap: undefined,
    loop: /\bwhile\s*\(/,
    array: /\b(\w+)\s*\[\s*\w+\s*\]\s*=\s*\{/,
  },
];

/**
 * Builds a source map for the given algorithm.
 * The analysis is intentionally conservative: it only reports a role when a
 * clear statement pattern was found.
 */
export function buildSourceMap(source: string, algorithmId: string | null): SourceMap {
  const lines = source.split(/\r?\n/);
  const stripped = lines.map((line) => stripCommentsAndStrings(line));

  const map: SourceMap = {
    algorithmId,
    lines: new Map(),
    arrayName: null,
    counterNames: [],
    recognised: false,
    note: '',
  };

  if (!algorithmId) {
    map.note = 'No algorithm was selected, so only plain source-line tracing is available.';
    return map;
  }

  const pattern = PATTERNS.find((entry) => entry.algorithmId === algorithmId);
  if (!pattern) {
    map.note = `No source analysis is available for "${algorithmId}".`;
    return map;
  }

  let comparisonLines = 0;
  let swapLines = 0;

  // Classify every line first; consecutive exchange statements are merged
  // into a single exchange afterwards so one logical swap is counted once.
  const rawRoles = new Map<number, SourceRole>();
  const swapCandidates: number[] = [];
  let depth = 0;
  const loopDepths: Array<{ line: number; depth: number }> = [];

  stripped.forEach((text, index) => {
    const lineNumber = index + 1;
    if (text.trim() === '') {
      return;
    }

    const opensBlock = (text.match(/\{/g) ?? []).length;
    const closesBlock = (text.match(/\}/g) ?? []).length;

    if (pattern.loop && pattern.loop.test(text)) {
      loopDepths.push({ line: lineNumber, depth });
      rawRoles.set(lineNumber, 'loop-iteration');
    } else if (
      pattern.comparison &&
      pattern.comparison.test(text) &&
      !/\bfor\s*\(|\bwhile\s*\(/.test(text)
    ) {
      rawRoles.set(lineNumber, 'comparison');
      comparisonLines += 1;
    } else if (pattern.swap && pattern.swap.test(text) && /=/.test(text)) {
      swapCandidates.push(lineNumber);
    }

    depth += opensBlock - closesBlock;
  });

  // Only the innermost loop drives the iteration counter; an outer loop would
  // otherwise be counted together with the inner one.
  const innermostDepth = loopDepths.reduce((max, entry) => Math.max(max, entry.depth), -1);
  for (const entry of loopDepths) {
    if (entry.depth !== innermostDepth) {
      rawRoles.delete(entry.line);
    }
  }

  // Merge consecutive exchange statements into one exchange. The statements of
  // one exchange form a small block (for example `int temp = ...` followed by
  // two assignments), so candidates that are only a few lines apart belong to
  // the same exchange.
  const SWAP_BLOCK_GAP = 3;
  let swapStart: number | null = null;
  let previousLine = -10;

  const flushSwap = (): void => {
    if (swapStart !== null) {
      rawRoles.set(swapStart, 'swap');
      swapLines += 1;
      swapStart = null;
    }
  };

  for (const line of swapCandidates) {
    if (swapStart !== null && line - previousLine <= SWAP_BLOCK_GAP) {
      // Part of the same exchange block.
    } else {
      flushSwap();
      swapStart = line;
    }
    previousLine = line;
  }
  flushSwap();

  for (const [line, role] of rawRoles) {
    map.lines.set(line, role);
  }

  // Find the array that the algorithm works on.
  for (const text of stripped) {
    const match = text.match(/\b(\w+)\s*\[\s*\w*\s*\]\s*=\s*\{/);
    if (match) {
      map.arrayName = match[1];
      break;
    }
  }

  // Find the loop counters.
  for (const text of stripped) {
    const match = text.match(/\bfor\s*\(\s*(?:int|size_t|long)?\s*(\w+)\s*=/);
    if (match && !map.counterNames.includes(match[1])) {
      map.counterNames.push(match[1]);
    }
  }

  map.recognised = comparisonLines > 0 || swapLines > 0;

  if (!map.recognised) {
    map.note =
      `The source does not contain the statements this extension recognises for ${algorithmId}, so operation counters cannot be derived. Source-line and variable tracing still work.`;
  } else {
    map.note = `Operation roles were derived from the source: ${comparisonLines} comparison line(s) and ${swapLines} exchange line(s) were recognised.`;
  }

  return map;
}

/**
 * Converts a trace step into the Phase 2 execution step shape so the existing
 * visualization components can render it.
 */
export function toVisualizationStep(input: {
  id: number;
  description: string;
  lineNumber: number;
  variables: Record<string, unknown>;
  arrayValues?: number[];
  comparedIndices?: number[];
  swappedIndices?: number[];
  comparisons: number;
  swaps: number;
  iterations: number;
}): ExecutionStep {
  const elementStyles: Record<number, { state: 'default' | 'comparing' | 'swapping' | 'updated' }> = {};
  for (const index of input.comparedIndices ?? []) {
    elementStyles[index] = { state: 'comparing' };
  }
  for (const index of input.swappedIndices ?? []) {
    elementStyles[index] = { state: 'swapping' };
  }

  const arrayState = input.arrayValues
    ? {
      values: input.arrayValues,
      length: input.arrayValues.length,
      elementStyles,
    }
    : undefined;

  return {
    id: input.id,
    description: input.description,
    operation: 'execute',
    lineNumber: input.lineNumber,
    currentState: {
      array: arrayState,
      variables: input.variables,
      stepIndex: input.id,
      status: 'running',
    },
    comparedElements: input.comparedIndices,
    swappedElements: input.swappedIndices,
    variables: input.variables,
    explanation: input.description,
    complexity: {
      operations: input.comparisons + input.swaps + input.iterations,
      comparisons: input.comparisons,
      swaps: input.swaps,
      iterations: input.iterations,
    },
  };
}
