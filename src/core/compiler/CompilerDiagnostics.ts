import type { CompileDiagnostic, DiagnosticCategory } from '../playground/types';

/**
 * Parses GCC diagnostics and turns them into beginner friendly explanations.
 *
 * The parser never rewrites the student's source code; it only describes what
 * the compiler reported and where.
 */

interface DiagnosticRule {
  category: DiagnosticCategory;
  test: RegExp;
  explanation: string;
  suggestion: string;
}

/**
 * Ordered rules: the first match wins, so more specific patterns are listed
 * before the generic ones.
 */
const RULES: DiagnosticRule[] = [
  {
    category: 'missing-semicolon',
    test: /expected ';'|expected ';' before|expected ';' at end|expected ['",;] or ';'|expected .*['";].* before/i,
    explanation:
      'The compiler expected a semicolon (\';\') to finish the previous statement. In C every statement — including declarations, assignments and return statements — ends with a semicolon.',
    suggestion: 'Look at the line directly above the reported line and add the missing semicolon.',
  },
  {
    category: 'missing-header',
    test: /no such file or directory|fatal error:.*\.h:|cannot find.*\.h/i,
    explanation:
      'A header file could not be found. Standard library headers such as <stdio.h> and <stdlib.h> must be included with angle brackets, and the compiler must be able to find them.',
    suggestion:
      'Check the #include line: use #include <stdio.h> for the standard library, and double brackets for your own headers.',
  },
  {
    category: 'undeclared-variable',
    test: /undeclared|has not been declared|not declared in this scope/i,
    explanation:
      'The program uses a variable that was never declared. C requires every variable to be introduced with a type before it is used.',
    suggestion: 'Declare the variable before use, for example: int x = 0;',
  },
  {
    category: 'function-declaration',
    test: /implicit declaration of function|conflicting types for|no previous prototype/i,
    explanation:
      'The compiler did not know the function you called. Either the function does not exist yet, its declaration is missing, or the header that declares it is not included.',
    suggestion:
      'Write the function before main (or declare it above main) and include the header that declares it.',
  },
  {
    category: 'type-mismatch',
    test: /incompatible types|conflicting types|invalid conversion|too (many|few) arguments|assignment to .* from .* makes/i,
    explanation:
      'The types of the values do not match. For example an int cannot be assigned to a pointer, or a float is passed where an int is expected.',
    suggestion:
      'Check the declaration of the variable, the parameter types of the function and the type of the value you are passing.',
  },
  {
    category: 'linker-error',
    test: /undefined reference|undefined symbol|cannot find -l|ld returned/i,
    explanation:
      'The compilation step succeeded but the linker could not find the machine code for a function that the program calls.',
    suggestion:
      'Make sure every function you call is defined in the same file, and check that a needed library is linked.',
  },
  {
    category: 'invalid-expression',
    test: /expected expression|expected identifier|expected primary-expression|lvalue required/i,
    explanation:
      'The compiler read an expression that does not make sense in this position — often a missing operand, a stray operator or a typo in a variable name.',
    suggestion: 'Read the reported line from left to right and check every operator and operand.',
  },
  {
    category: 'syntax-error',
    test: /expected .* before|unexpected|stray|missing .* terminator|unterminated/i,
    explanation:
      'The structure of the program does not follow the C grammar — a bracket, a comma or a keyword is missing or misplaced.',
    suggestion: 'Check that every opening brace, parenthesis and quote is closed on the same line it was opened.',
  },
];

/** Matches `file:line:column: severity: message` and the shorter variants. */
const DIAGNOSTIC_PATTERN = /^(.*?):(\d+):(?:(\d+):)?\s*(fatal error|error|warning|note):\s*(.*)$/;
const LINKER_PATTERN = /^(?:.*\s)?(undefined reference to|undefined symbol).*$/i;

let diagnosticCounter = 0;

function nextDiagnosticId(): string {
  diagnosticCounter += 1;
  return `diag-${diagnosticCounter}-${Date.now().toString(36)}`;
}

/** Splits a compiler message such as "unused variable 'x' [-Wunused-variable]". */
function splitMessage(message: string): { text: string; flag: string | null } {
  const match = message.match(/^(.*?)\s*\[(-W[a-z0-9-]+)\]$/);
  if (!match) {
    return { text: message.trim(), flag: null };
  }
  return { text: match[1].trim(), flag: match[2] };
}

function explain(text: string, severity: 'error' | 'warning' | 'note'): { category: DiagnosticCategory; explanation: string; suggestion: string | null } {
  for (const rule of RULES) {
    if (rule.test.test(text)) {
      return {
        category: rule.category,
        explanation: rule.explanation,
        suggestion: rule.suggestion,
      };
    }
  }

  if (severity === 'warning') {
    return {
      category: 'warning',
      explanation:
        'The compiler compiled the program, but it points out a construct that is legal yet usually a mistake. Warnings do not stop execution.',
      suggestion: 'Read the message and decide whether the code should be changed.',
    };
  }

  if (severity === 'note') {
    return {
      category: 'other',
      explanation: 'This is additional information from the compiler that helps to interpret another diagnostic.',
      suggestion: null,
    };
  }

  return {
    category: 'syntax-error',
    explanation:
      'The compiler could not understand this part of the program. The message names the construct that was unexpected.',
    suggestion: 'Compare the reported line with the surrounding braces and statements.',
  };
}

/**
 * Parses raw compiler output into structured diagnostics.
 * `sourceLines` is used to attach the offending source line to each message.
 */
export function parseCompilerDiagnostics(
  output: string,
  sourceLines: string[] = []
): CompileDiagnostic[] {
  const diagnostics: CompileDiagnostic[] = [];
  const lines = output.split(/\r?\n/);

  let currentFile = '';
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) {
      continue;
    }

    // GCC prints context lines such as `prog.c: In function 'main':`
    const contextMatch = line.match(/^(.*?):\s+In function '([^']+)':$/);
    if (contextMatch) {
      currentFile = contextMatch[1];
      continue;
    }

    if (/^(?:collect2|ld):\s/.test(line) || LINKER_PATTERN.test(line)) {
      diagnostics.push(
        createDiagnostic({
          file: currentFile || 'linker',
          line: 0,
          column: null,
          raw: line,
          severity: 'error',
          sourceLines,
        })
      );
      continue;
    }

    const match = line.match(DIAGNOSTIC_PATTERN);
    if (!match) {
      continue;
    }

    const [, file, lineNumber, column, severity, message] = match;
    diagnostics.push(
      createDiagnostic({
        file: file || currentFile || 'program.c',
        line: Number(lineNumber),
        column: column ? Number(column) : null,
        raw: message,
        severity: (severity === 'fatal error' ? 'error' : severity) as 'error' | 'warning' | 'note',
        sourceLines,
      })
    );
  }

  return diagnostics;
}

function createDiagnostic(input: {
  file: string;
  line: number;
  column: number | null;
  raw: string;
  severity: 'error' | 'warning' | 'note';
  sourceLines: string[];
}): CompileDiagnostic {
  const { text, flag } = splitMessage(input.raw);
  const { category, explanation, suggestion } = explain(text, input.severity);

  return {
    id: nextDiagnosticId(),
    severity: input.severity,
    file: input.file,
    line: input.line,
    column: input.column,
    message: flag ? `${text} [${flag}]` : text,
    category,
    explanation,
    suggestion,
    sourceLine: input.line > 0 ? input.sourceLines[input.line - 1] ?? null : null,
  };
}

/** True when the diagnostics contain at least one hard error. */
export function hasErrors(diagnostics: CompileDiagnostic[]): boolean {
  return diagnostics.some((d) => d.severity === 'error');
}

/** Human readable label for a diagnostic category. */
export function describeCategory(category: DiagnosticCategory): string {
  switch (category) {
  case 'syntax-error':
    return 'Syntax error';
  case 'missing-header':
    return 'Missing header';
  case 'undeclared-variable':
    return 'Undeclared variable';
  case 'type-mismatch':
    return 'Type mismatch';
  case 'function-declaration':
    return 'Function declaration';
  case 'missing-semicolon':
    return 'Missing semicolon';
  case 'invalid-expression':
    return 'Invalid expression';
  case 'linker-error':
    return 'Linker error';
  case 'warning':
    return 'Warning';
  default:
    return 'Compiler message';
  }
}
