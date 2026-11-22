/**
 * A small C tokenizer used by the playground editor for syntax highlighting.
 *
 * It is intentionally simple: it recognises the token classes a student
 * needs to see (keywords, types, numbers, strings, characters, comments and
 * preprocessor lines). It is not a parser and never modifies the source.
 */

export type TokenType =
  | 'keyword'
  | 'type'
  | 'number'
  | 'string'
  | 'char'
  | 'comment'
  | 'preprocessor'
  | 'function'
  | 'operator'
  | 'plain';

export interface Token {
  text: string;
  type: TokenType;
}

export const C_KEYWORDS = [
  'auto',
  'break',
  'case',
  'const',
  'continue',
  'default',
  'do',
  'else',
  'enum',
  'extern',
  'for',
  'goto',
  'if',
  'inline',
  'register',
  'restrict',
  'return',
  'sizeof',
  'static',
  'struct',
  'switch',
  'typedef',
  'union',
  'volatile',
  'while',
];

export const C_TYPES = [
  'char',
  'double',
  'float',
  'int',
  'long',
  'short',
  'signed',
  'unsigned',
  'void',
  'bool',
  'size_t',
  'FILE',
];

const OPERATOR_CHARS = '+-*/%=<>!&|^~?:.,;()[]{}';

/** Splits C source into highlighted tokens. */
export function tokenizeC(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let plain = '';

  const flushPlain = (): void => {
    if (plain.length > 0) {
      tokens.push({ text: plain, type: 'plain' });
      plain = '';
    }
  };

  const push = (text: string, type: TokenType): void => {
    flushPlain();
    tokens.push({ text, type });
  };

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    // Preprocessor directive (whole line).
    if (char === '#' && /^\s*#/.test(source.slice(index, index + 40))) {
      const lineEnd = source.indexOf('\n', index);
      const end = lineEnd === -1 ? source.length : lineEnd;
      push(source.slice(index, end), 'preprocessor');
      index = end;
      continue;
    }

    // Line comment.
    if (char === '/' && next === '/') {
      const lineEnd = source.indexOf('\n', index);
      const end = lineEnd === -1 ? source.length : lineEnd;
      push(source.slice(index, end), 'comment');
      index = end;
      continue;
    }

    // Block comment.
    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      const stop = end === -1 ? source.length : end + 2;
      push(source.slice(index, stop), 'comment');
      index = stop;
      continue;
    }

    // String literal.
    if (char === '"') {
      let cursor = index + 1;
      while (cursor < source.length) {
        if (source[cursor] === '\\') {
          cursor += 2;
          continue;
        }
        if (source[cursor] === '"') {
          cursor += 1;
          break;
        }
        cursor += 1;
      }
      push(source.slice(index, cursor), 'string');
      index = cursor;
      continue;
    }

    // Character literal.
    if (char === '\'') {
      let cursor = index + 1;
      while (cursor < source.length) {
        if (source[cursor] === '\\') {
          cursor += 2;
          continue;
        }
        if (source[cursor] === '\'') {
          cursor += 1;
          break;
        }
        cursor += 1;
      }
      push(source.slice(index, cursor), 'char');
      index = cursor;
      continue;
    }

    // Number.
    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(next ?? ''))) {
      let cursor = index;
      while (cursor < source.length && /[0-9a-fA-FxX.]/.test(source[cursor])) {
        cursor += 1;
      }
      push(source.slice(index, cursor), 'number');
      index = cursor;
      continue;
    }

    // Identifier (possibly a keyword, a type or a function call).
    if (/[A-Za-z_]/.test(char)) {
      let cursor = index;
      while (cursor < source.length && /[A-Za-z0-9_]/.test(source[cursor])) {
        cursor += 1;
      }
      const word = source.slice(index, cursor);

      // Look ahead for a '(' to detect a call.
      let lookahead = cursor;
      while (lookahead < source.length && /\s/.test(source[lookahead])) {
        lookahead += 1;
      }
      const isCall = source[lookahead] === '(';

      if (C_KEYWORDS.includes(word)) {
        push(word, 'keyword');
      } else if (C_TYPES.includes(word)) {
        push(word, 'type');
      } else if (isCall) {
        push(word, 'function');
      } else {
        plain += word;
      }

      index = cursor;
      continue;
    }

    // Operator or punctuation.
    if (OPERATOR_CHARS.includes(char)) {
      push(char, 'operator');
      index += 1;
      continue;
    }

    plain += char;
    index += 1;
  }

  flushPlain();
  return tokens;
}

/** Escapes a string so it can be rendered as HTML text. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
