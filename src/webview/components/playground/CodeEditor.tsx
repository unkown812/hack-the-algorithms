import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Box } from '../primitives';
import { COLORS, RADIUS, SPACING } from '../Theme';
import { escapeHtml, tokenizeC } from './cSyntax';
import type { TokenType } from './cSyntax';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Line numbers (1 based) that carry a breakpoint. */
  breakpoints?: number[];
  /** Lines that carry a compiler error or warning. */
  markers?: Array<{ line: number; severity: 'error' | 'warning' }>;
  /** Line that is currently executing. */
  currentLine?: number;
  readOnly?: boolean;
  /** Called when the user clicks a line number in the gutter. */
  onToggleBreakpoint?: (line: number) => void;
}

const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: '#c084fc',
  type: '#22d3ee',
  number: '#fbbf24',
  string: '#86efac',
  char: '#86efac',
  comment: '#64748b',
  preprocessor: '#f472b6',
  function: '#60a5fa',
  operator: '#94a3b8',
  plain: '#e2e8f0',
};

const EDITOR_FONT = '"SF Mono", Menlo, Consolas, "Courier New", monospace';

/**
 * A lightweight code editor for the playground.
 *
 * It provides the essentials a student needs while debugging: line numbers,
 * a breakpoint gutter, C syntax highlighting, the currently executing line and
 * tab indentation. The full power of the VS Code editor (find/replace, folding,
 * extensions) stays available by opening the saved program file in the
 * workspace.
 */
export const CodeEditor: FunctionComponent<CodeEditorProps> = ({
  value,
  onChange,
  breakpoints = [],
  markers = [],
  currentLine,
  readOnly = false,
  onToggleBreakpoint,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  const lines = useMemo(() => value.split('\n'), [value]);
  const breakpointSet = useMemo(() => new Set(breakpoints), [breakpoints]);
  const markerMap = useMemo(() => {
    const map = new Map<number, 'error' | 'warning'>();
    for (const marker of markers) {
      if (marker.severity === 'error' || !map.has(marker.line)) {
        map.set(marker.line, marker.severity);
      }
    }
    return map;
  }, [markers]);

  const highlighted = useMemo(() => {
    const tokens = tokenizeC(value);
    return tokens
      .map(
        (token) =>
          `<span style="color:${TOKEN_COLORS[token.type]}">${escapeHtml(token.text)}</span>`
      )
      .join('');
  }, [value]);

  const syncScroll = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    if (highlightRef.current) {
      highlightRef.current.scrollTop = textarea.scrollTop;
      highlightRef.current.scrollLeft = textarea.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = textarea.scrollTop;
    }
  }, []);

  // Keep the caret position stable when the parent re-renders the value.
  useEffect(() => {
    syncScroll();
  }, [value, syncScroll]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    const textarea = event.currentTarget;

    if (event.key === 'Tab') {
      event.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const next = `${value.slice(0, start)}    ${value.slice(end)}`;
      onChange(next);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      });
      return;
    }

    if (event.key === 'Enter') {
      // Keep the indentation of the current line and add one level after '{'.
      const start = textarea.selectionStart;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLineText = value.slice(lineStart, start);
      const indent = currentLineText.match(/^\s*/)?.[0] ?? '';
      const extra = /\{\s*$/.test(currentLineText) ? '    ' : '';

      if (indent.length === 0 && extra.length === 0) {
        return;
      }

      event.preventDefault();
      const insertion = `\n${indent}${extra}`;
      const next = `${value.slice(0, start)}${insertion}${value.slice(textarea.selectionEnd)}`;
      onChange(next);
      requestAnimationFrame(() => {
        const position = start + insertion.length;
        textarea.selectionStart = textarea.selectionEnd = position;
      });
    }
  };

  const gutterHeight = `${Math.max(lines.length, 12) * 20}px`;

  return (
    <Box
      style={{
        display: 'flex',
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.md,
        backgroundColor: '#0b1220',
        overflow: 'hidden',
        minHeight: 260,
      }}
    >
      <div
        ref={gutterRef}
        style={{
          width: 52,
          flexShrink: 0,
          overflow: 'hidden',
          backgroundColor: '#0f172a',
          borderRight: `1px solid ${COLORS.border}`,
          paddingTop: 8,
          userSelect: 'none',
        }}
      >
        {lines.map((_, index) => {
          const lineNumber = index + 1;
          const hasBreakpoint = breakpointSet.has(lineNumber);
          const isCurrent = currentLine === lineNumber;
          const marker = markerMap.get(lineNumber);

          return (
            <div
              key={lineNumber}
              onClick={() => onToggleBreakpoint?.(lineNumber)}
              title={
                marker
                  ? marker === 'error'
                    ? 'Compiler error on this line'
                    : 'Compiler warning on this line'
                  : onToggleBreakpoint
                    ? hasBreakpoint
                      ? 'Remove breakpoint'
                      : 'Set breakpoint'
                    : undefined
              }
              style={{
                height: 20,
                lineHeight: '20px',
                paddingRight: 8,
                textAlign: 'right',
                fontFamily: EDITOR_FONT,
                fontSize: '0.8rem',
                color: isCurrent ? COLORS.accent : COLORS.textMuted,
                backgroundColor: isCurrent ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                cursor: onToggleBreakpoint ? 'pointer' : 'default',
                position: 'relative',
              }}
            >
              {hasBreakpoint && (
                <span
                  style={{
                    position: 'absolute',
                    left: 6,
                    top: 6,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: COLORS.error,
                  }}
                />
              )}
              {marker && !hasBreakpoint && (
                <span
                  style={{
                    position: 'absolute',
                    left: 6,
                    top: 5,
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: marker === 'error' ? COLORS.error : COLORS.warning,
                    fontSize: '0.55rem',
                    color: '#0b1220',
                    fontWeight: 700,
                    lineHeight: '10px',
                    textAlign: 'center',
                  }}
                >
                  {marker === 'error' ? '×' : '!'}
                </span>
              )}
              {lineNumber}
            </div>
          );
        })}
        <div style={{ height: 0, minHeight: gutterHeight }} />
      </div>

      <Box style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <pre
          ref={highlightRef}
          aria-hidden="true"
          style={{
            margin: 0,
            padding: `8px ${SPACING.md}`,
            fontFamily: EDITOR_FONT,
            fontSize: '0.8rem',
            lineHeight: '20px',
            whiteSpace: 'pre',
            color: COLORS.textPrimary,
            pointerEvents: 'none',
          }}
          dangerouslySetInnerHTML={{
            __html: `${highlighted}\n`.split('\n').join('\n'),
          }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          wrap="off"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            margin: 0,
            padding: `8px ${SPACING.md}`,
            fontFamily: EDITOR_FONT,
            fontSize: '0.8rem',
            lineHeight: '20px',
            color: 'transparent',
            caretColor: COLORS.accent,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            whiteSpace: 'pre',
            overflow: 'auto',
            tabSize: 4,
          }}
        />
      </Box>
    </Box>
  );
};
