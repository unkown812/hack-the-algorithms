import type { ExecutionConfig, CompilerStandard, OptimizationLevel } from '../playground/types';

/**
 * Execution configuration for locally compiled programs.
 *
 * The defaults are deliberately conservative: a short timeout and a bounded
 * output size protect the machine (and the extension host) from runaway
 * student programs.
 */

export const DEFAULT_TIMEOUT_MS = 5000;
export const MAX_TIMEOUT_MS = 60000;
export const MIN_TIMEOUT_MS = 250;

export const DEFAULT_MAX_OUTPUT_BYTES = 256 * 1024;

/** Hard ceiling for captured output regardless of configuration. */
export const ABSOLUTE_MAX_OUTPUT_BYTES = 4 * 1024 * 1024;

export const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
  language: 'c',
  standard: 'c11',
  optimization: 'O0',
  timeoutMs: DEFAULT_TIMEOUT_MS,
  maxOutputBytes: DEFAULT_MAX_OUTPUT_BYTES,
  debugSymbols: true,
};

/** Clamps a requested timeout into the supported range. */
export function clampTimeout(timeoutMs: number): number {
  if (!Number.isFinite(timeoutMs)) {
    return DEFAULT_TIMEOUT_MS;
  }
  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, Math.round(timeoutMs)));
}

/** Clamps a requested output cap into the supported range. */
export function clampMaxOutputBytes(bytes: number): number {
  if (!Number.isFinite(bytes)) {
    return DEFAULT_MAX_OUTPUT_BYTES;
  }
  return Math.min(ABSOLUTE_MAX_OUTPUT_BYTES, Math.max(1024, Math.round(bytes)));
}

/** Normalises a partially supplied configuration. */
export function normalizeExecutionConfig(config?: Partial<ExecutionConfig>): ExecutionConfig {
  const merged: ExecutionConfig = { ...DEFAULT_EXECUTION_CONFIG, ...config };
  return {
    ...merged,
    timeoutMs: clampTimeout(merged.timeoutMs),
    maxOutputBytes: clampMaxOutputBytes(merged.maxOutputBytes),
  };
}

/** The compiler-relevant part of an execution configuration. */
export interface CompilerFlags {
  standard: CompilerStandard;
  optimization: OptimizationLevel;
  debugSymbols: boolean;
}

export function toCompilerFlags(config: ExecutionConfig): CompilerFlags {
  return {
    standard: config.standard,
    optimization: config.optimization,
    debugSymbols: config.debugSymbols,
  };
}
