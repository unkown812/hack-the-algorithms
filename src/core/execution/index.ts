export interface ExecutionRequest {
  algorithmId: string;
  code: string;
  input?: string;
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
  executionTimeMs?: number;
}

export async function executeAlgorithm(
  _request: ExecutionRequest
): Promise<ExecutionResult> {
  return {
    success: false,
    error: 'Code execution is not yet implemented in Phase 1.',
    exitCode: -1,
  };
}

export function isExecutionSupported(): boolean {
  return false;
}
