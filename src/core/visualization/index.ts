export interface VisualizationRequest {
  algorithmId: string;
  data?: unknown;
}

export interface VisualizationResult {
  algorithmId: string;
  svg?: string;
  steps?: unknown[];
}

export async function generateVisualization(
  _request: VisualizationRequest
): Promise<VisualizationResult> {
  return {
    algorithmId: _request.algorithmId,
    steps: [],
  };
}

export function isVisualizationSupported(): boolean {
  return false;
}
