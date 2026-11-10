import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { CompilerInfo } from '../playground/types';

/**
 * Detects a local C compiler (GCC or a GCC-compatible toolchain such as
 * MinGW-w64 / MSYS2) and verifies that it really works.
 *
 * Nothing here is ever simulated: when no compiler is found the detection
 * result says so and the extension refuses to compile.
 */

const SMOKE_TEST_SOURCE = `#include <stdio.h>
int main(void) {
    printf("daa-ok\\n");
    return 0;
}
`;

const SMOKE_TEST_OUTPUT = 'daa-ok';

/** Well known installation paths, per platform. */
const CANDIDATE_PATHS: Record<string, string[]> = {
  win32: [
    'C:\\mingw64\\bin\\gcc.exe',
    'C:\\msys64\\mingw64\\bin\\gcc.exe',
    'C:\\msys64\\ucrt64\\bin\\gcc.exe',
    'C:\\msys64\\clang64\\bin\\gcc.exe',
    'C:\\TDM-GCC-64\\bin\\gcc.exe',
    'C:\\Strawberry\\c\\bin\\gcc.exe',
    'C:\\ProgramData\\chocolatey\\bin\\gcc.exe',
    'C:\\cygwin64\\bin\\gcc.exe',
    'C:\\MinGW\\bin\\gcc.exe',
  ],
  darwin: ['/usr/bin/gcc', '/usr/local/bin/gcc', '/opt/homebrew/bin/gcc'],
  linux: ['/usr/bin/gcc', '/usr/local/bin/gcc', '/bin/gcc', '/usr/bin/cc'],
};

const INSTALL_HINTS: Record<string, string> = {
  win32:
    'Install a GCC toolchain, for example MSYS2 (https://www.msys2.org) or MinGW-w64, and make sure gcc.exe is on your PATH. On MSYS2 the compiler usually lives in C:\\msys64\\ucrt64\\bin\\gcc.exe.',
  darwin:
    'Install the Xcode command line tools with "xcode-select --install" — they provide /usr/bin/gcc.',
  linux: 'Install GCC with your package manager, for example "sudo apt install build-essential" or "sudo dnf install gcc".',
};

export interface DetectionOptions {
  /** Explicit compiler path configured by the student. */
  configuredPath?: string | null;
  platform?: NodeJS.Platform;
}

/** Returns the first existing, executable candidate path. */
function findCandidateExecutable(platform: NodeJS.Platform): string | null {
  const candidates = CANDIDATE_PATHS[platform] ?? [];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      // Ignore unreadable candidates and continue searching.
    }
  }

  // Fall back to a PATH lookup.
  const lookup = platform === 'win32' ? 'where' : 'which';
  try {
    const result = spawnSync(lookup, ['gcc'], {
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
      shell: false,
    });
    if (result.status === 0 && result.stdout) {
      const first = result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)[0];
      if (first && fs.existsSync(first)) {
        return first;
      }
    }
  } catch {
    // `where`/`which` may be missing in minimal environments.
  }

  return null;
}

/** Reads the first line of `gcc --version`. */
export function readCompilerVersion(executablePath: string): string {
  try {
    const result = spawnSync(executablePath, ['--version'], {
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true,
      shell: false,
    });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
    const firstLine = output.split(/\r?\n/)[0]?.trim() ?? '';
    return firstLine || 'unknown version';
  } catch {
    return 'unknown version';
  }
}

/**
 * Compiles and runs a tiny program to prove the toolchain really works.
 * Returns true only when the program printed the expected marker.
 */
export function verifyCompiler(executablePath: string): boolean {
  let workDir: string | null = null;
  try {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'daa-cc-check-'));
    const sourcePath = path.join(workDir, 'check.c');
    const binaryPath = path.join(workDir, 'check.exe');
    fs.writeFileSync(sourcePath, SMOKE_TEST_SOURCE, 'utf8');

    const compile = spawnSync(
      executablePath,
      ['-std=c11', '-o', binaryPath, sourcePath],
      { encoding: 'utf8', timeout: 30000, windowsHide: true, shell: false }
    );
    if (compile.status !== 0) {
      return false;
    }

    const run = spawnSync(binaryPath, [], {
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true,
      shell: false,
    });
    return run.status === 0 && (run.stdout ?? '').trim() === SMOKE_TEST_OUTPUT;
  } catch {
    return false;
  } finally {
    if (workDir) {
      try {
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch {
        // Best effort cleanup.
      }
    }
  }
}

/**
 * Detects the compiler and returns its status.
 * Never throws: an unavailable compiler is a normal, reportable state.
 */
export function detectCompiler(options: DetectionOptions = {}): CompilerInfo {
  const platform = options.platform ?? process.platform;
  const configured = options.configuredPath?.trim();

  let executablePath = '';
  let reason: string | undefined;

  if (configured) {
    if (fs.existsSync(configured)) {
      executablePath = configured;
    } else {
      reason = `The configured compiler path "${configured}" does not exist.`;
    }
  } else {
    executablePath = findCandidateExecutable(platform) ?? '';
    if (!executablePath) {
      reason = 'No GCC executable was found on this system.';
    }
  }

  if (!executablePath) {
    return {
      id: 'gcc',
      name: 'GCC',
      executablePath: '',
      version: '',
      available: false,
      verified: false,
      supportedStandards: ['c99', 'c11', 'c17'],
      platform,
      detectedAt: Date.now(),
      unavailableReason: reason,
      installHint: INSTALL_HINTS[platform] ?? INSTALL_HINTS.linux,
    };
  }

  const version = readCompilerVersion(executablePath);
  const verified = verifyCompiler(executablePath);

  return {
    id: 'gcc',
    name: 'GCC',
    executablePath,
    version,
    available: true,
    verified,
    supportedStandards: ['c99', 'c11', 'c17'],
    platform,
    detectedAt: Date.now(),
    unavailableReason: verified ? undefined : 'GCC was found but a test program failed to compile and run.',
    installHint: INSTALL_HINTS[platform],
  };
}

/** Detects the GDB debugger without verifying it against a binary. */
export function detectDebuggerExecutable(platform: NodeJS.Platform = process.platform): {
  path: string;
  version: string;
} {
  const candidates: Record<string, string[]> = {
    win32: [
      'C:\\mingw64\\bin\\gdb.exe',
      'C:\\msys64\\mingw64\\bin\\gdb.exe',
      'C:\\msys64\\ucrt64\\bin\\gdb.exe',
      'C:\\TDM-GCC-64\\bin\\gdb.exe',
      'C:\\Strawberry\\c\\bin\\gdb.exe',
    ],
    darwin: ['/usr/bin/gdb', '/usr/local/bin/gdb', '/opt/homebrew/bin/gdb'],
    linux: ['/usr/bin/gdb', '/usr/local/bin/gdb', '/bin/gdb'],
  };

  let found = '';
  for (const candidate of candidates[platform] ?? []) {
    try {
      if (fs.existsSync(candidate)) {
        found = candidate;
        break;
      }
    } catch {
      // Continue searching.
    }
  }

  if (!found) {
    const lookup = platform === 'win32' ? 'where' : 'which';
    try {
      const result = spawnSync(lookup, ['gdb'], {
        encoding: 'utf8',
        timeout: 5000,
        windowsHide: true,
        shell: false,
      });
      if (result.status === 0 && result.stdout) {
        found = result.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)[0] ?? '';
      }
    } catch {
      // Ignore.
    }
  }

  if (!found) {
    return { path: '', version: '' };
  }

  let version = 'unknown version';
  try {
    const result = spawnSync(found, ['--version'], {
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true,
      shell: false,
    });
    version = result.stdout?.split(/\r?\n/)[0]?.trim() ?? 'unknown version';
  } catch {
    // Keep the default.
  }

  return { path: found, version };
}
