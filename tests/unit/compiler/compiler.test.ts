import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { detectCompiler, readCompilerVersion, verifyCompiler } from '../../../src/core/compiler/CompilerDetector';
import { GCCCompiler, buildCompilerArgs, validateExtraArgs, CompilerArgumentError } from '../../../src/core/compiler/GCCCompiler';
import { parseCompilerDiagnostics, hasErrors, describeCategory } from '../../../src/core/compiler/CompilerDiagnostics';
import type { CompilerConfiguration } from '../../../src/core/playground/types';

const CONFIG: CompilerConfiguration = {
  compilerPath: null,
  standard: 'c11',
  optimization: 'O0',
  warningLevel: 'basic',
  debugSymbols: true,
  extraArgs: [],
};

const compiler = detectCompiler();
const hasGcc = compiler.available && compiler.verified;

describe('compiler detection', () => {
  it('reports a compiler status for this machine', () => {
    expect(compiler.id).toBe('gcc');
    expect(typeof compiler.available).toBe('boolean');
    expect(compiler.supportedStandards).toContain('c11');
    expect(compiler.platform).toBeTruthy();
  });

  it('reports a missing compiler honestly when the path does not exist', () => {
    const result = detectCompiler({ configuredPath: 'C:\\definitely\\not\\gcc.exe' });
    expect(result.available).toBe(false);
    expect(result.unavailableReason).toMatch(/does not exist/i);
    expect(result.installHint).toBeTruthy();
  });

  it('reads a compiler version', () => {
    if (!hasGcc) {
      expect(readCompilerVersion('definitely-not-a-compiler')).toBe('unknown version');
      return;
    }
    const version = readCompilerVersion(compiler.executablePath);
    expect(version.length).toBeGreaterThan(0);
    expect(version.toLowerCase()).toContain('gcc');
  });

  it('verifies the toolchain by compiling and running a test program', () => {
    if (!hasGcc) {
      expect(verifyCompiler('definitely-not-a-compiler')).toBe(false);
      return;
    }
    expect(verifyCompiler(compiler.executablePath)).toBe(true);
  });
});

describe('compiler configuration', () => {
  it('builds the flags for the selected standard and optimization', () => {
    const args = buildCompilerArgs({ ...CONFIG, standard: 'c99', optimization: 'O2' });
    expect(args).toContain('-std=c99');
    expect(args).toContain('-O2');
    expect(args).toContain('-Wall');
    expect(args).toContain('-g');
  });

  it('adds the extra warning level', () => {
    expect(buildCompilerArgs({ ...CONFIG, warningLevel: 'extra' })).toContain('-Wextra');
    expect(buildCompilerArgs({ ...CONFIG, warningLevel: 'none' })).not.toContain('-Wextra');
  });

  it('rejects arguments that would escape the compilation model', () => {
    expect(() => validateExtraArgs(['-o', '/tmp/other'])).toThrow(CompilerArgumentError);
    expect(() => validateExtraArgs(['-o/tmp/other'])).toThrow(CompilerArgumentError);
    expect(() => validateExtraArgs(['-specs=evil.spec'])).toThrow(CompilerArgumentError);
    expect(() => validateExtraArgs(['-fplugin=evil.so'])).toThrow(CompilerArgumentError);
    expect(() => validateExtraArgs(['-wrapper=evil'])).toThrow(CompilerArgumentError);
    // Shell metacharacters are refused even though no shell is used.
    expect(() => validateExtraArgs(['a; rm -rf /'])).toThrow(CompilerArgumentError);
    expect(() => validateExtraArgs(['$(whoami)'])).toThrow(CompilerArgumentError);
    expect(() => validateExtraArgs(['-Wall', '-Wextra'])).not.toThrow();
  });
});

describe('compilation', () => {
  it('compiles a correct program', () => {
    if (!hasGcc) {
      return;
    }

    const gcc = new GCCCompiler(compiler);
    const outcome = gcc.compile({
      source: '#include <stdio.h>\nint main(void){printf("ok\\n");return 0;}\n',
      configuration: CONFIG,
    });

    expect(outcome.success).toBe(true);
    expect(outcome.binaryPath).toBeTruthy();
    expect(outcome.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
    expect(outcome.commandLine.join(' ')).toContain('-std=c11');
  });

  it('reports a missing semicolon with an explanation', () => {
    if (!hasGcc) {
      return;
    }

    const gcc = new GCCCompiler(compiler);
    const outcome = gcc.compile({
      source: '#include <stdio.h>\nint main(void){int x = 5\nreturn 0;}\n',
      configuration: CONFIG,
    });

    expect(outcome.success).toBe(false);
    expect(outcome.binaryPath).toBeNull();

    const error = outcome.diagnostics.find((d) => d.severity === 'error');
    expect(error).toBeDefined();
    expect(error?.category).toBe('missing-semicolon');
    expect(error?.explanation).toMatch(/semicolon/i);
    expect(error?.suggestion).toBeTruthy();
    expect(error?.line).toBeGreaterThan(0);
    // GCC reports the line where it noticed the problem.
    expect(error?.sourceLine).toBe('return 0;}');
  });

  it('reports an undeclared variable', () => {
    if (!hasGcc) {
      return;
    }

    const gcc = new GCCCompiler(compiler);
    const outcome = gcc.compile({
      source: '#include <stdio.h>\nint main(void){return unknownValue;}\n',
      configuration: CONFIG,
    });

    expect(outcome.success).toBe(false);
    const error = outcome.diagnostics.find((d) => d.severity === 'error');
    expect(error?.category).toBe('undeclared-variable');
    expect(error?.explanation.length ?? 0).toBeGreaterThan(20);
  });

  it('reports a missing header', () => {
    if (!hasGcc) {
      return;
    }

    const gcc = new GCCCompiler(compiler);
    const outcome = gcc.compile({
      source: '#include <not_a_real_header.h>\nint main(void){return 0;}\n',
      configuration: CONFIG,
    });

    expect(outcome.success).toBe(false);
    expect(outcome.diagnostics.some((d) => d.category === 'missing-header')).toBe(true);
  });

  it('compiles with the requested C standard', () => {
    if (!hasGcc) {
      return;
    }

    const gcc = new GCCCompiler(compiler);
    for (const standard of ['c99', 'c11', 'c17'] as const) {
      const outcome = gcc.compile({
        source: '#include <stdio.h>\nint main(void){return 0;}\n',
        configuration: { ...CONFIG, standard },
      });
      expect(outcome.success, `standard ${standard}`).toBe(true);
    }
  });

  it('never compiles when no compiler is available', () => {
    const unavailable = {
      ...compiler,
      available: false,
      executablePath: '',
      verified: false,
      unavailableReason: 'No C compiler is available.',
    };
    const gcc = new GCCCompiler(unavailable);
    const outcome = gcc.compile({ source: 'int main(void){return 0;}', configuration: CONFIG });

    expect(outcome.success).toBe(false);
    expect(outcome.binaryPath).toBeNull();
    expect(outcome.diagnostics[0].message).toMatch(/no c compiler/i);
  });
});

describe('diagnostics parsing', () => {
  it('parses errors with a line and a column', () => {
    const diagnostics = parseCompilerDiagnostics(
      "program.c:12:7: error: expected ';' before 'return' token"
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].severity).toBe('error');
    expect(diagnostics[0].line).toBe(12);
    expect(diagnostics[0].column).toBe(7);
    expect(diagnostics[0].category).toBe('missing-semicolon');
  });

  it('parses warnings and keeps the warning flag', () => {
    const diagnostics = parseCompilerDiagnostics(
      "program.c:5:9: warning: unused variable 'x' [-Wunused-variable]"
    );

    expect(diagnostics[0].severity).toBe('warning');
    expect(diagnostics[0].message).toContain('-Wunused-variable');
    expect(diagnostics[0].category).toBe('warning');
  });

  it('parses linker errors', () => {
    const diagnostics = parseCompilerDiagnostics(
      "C:\\tmp\\program.c: In function 'main':\nC:\\tmp\\program.c:4: undefined reference to `missingFunction'"
    );

    expect(hasErrors(diagnostics)).toBe(true);
    expect(diagnostics[0].category).toBe('linker-error');
  });

  it('attaches the source line when it is known', () => {
    const diagnostics = parseCompilerDiagnostics('program.c:2:3: error: expected expression', [
      '#include <stdio.h>',
      'int x = ;',
    ]);

    expect(diagnostics[0].sourceLine).toBe('int x = ;');
  });

  it('describes every category', () => {
    expect(describeCategory('missing-semicolon')).toBe('Missing semicolon');
    expect(describeCategory('undeclared-variable')).toBe('Undeclared variable');
    expect(describeCategory('other')).toBe('Compiler message');
  });
});

describe('temporary build directories', () => {
  it('compiles into the requested directory and removes nothing on its own', () => {
    if (!hasGcc) {
      return;
    }

    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'daa-test-build-'));
    const gcc = new GCCCompiler(compiler);
    const outcome = gcc.compile({
      source: 'int main(void){return 0;}\n',
      configuration: CONFIG,
      outputDirectory: directory,
    });

    expect(outcome.success).toBe(true);
    expect(fs.existsSync(directory)).toBe(true);
    fs.rmSync(directory, { recursive: true, force: true });
  });
});
