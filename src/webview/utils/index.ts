declare var window: {
  acquireVsCodeApi?: () => {
    postMessage(message: { type: string; payload?: unknown }): void;
    setState(state: unknown): void;
    getState(): unknown;
  };
  addEventListener: (event: string, handler: (event: MessageEvent) => void) => void;
  removeEventListener: (event: string, handler: (event: MessageEvent) => void) => void;
};

export function postToExtension(message: { type: string; payload?: unknown }): void {
  const acquireVsCodeApi = (window as unknown as { acquireVsCodeApi?: () => PostOffice }).acquireVsCodeApi;
  const vscodeApi = acquireVsCodeApi ? acquireVsCodeApi() : undefined;

  if (vscodeApi) {
    vscodeApi.postMessage(message);
  }
}

export function onExtensionMessage(
  handler: (event: MessageEvent) => void
): () => void {
  const acquireVsCodeApi = (window as unknown as { acquireVsCodeApi?: () => PostOffice }).acquireVsCodeApi;
  const vscodeApi = acquireVsCodeApi ? acquireVsCodeApi() : undefined;

  if (!vscodeApi) {
    return () => undefined;
  }

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

interface PostOffice {
  postMessage(message: { type: string; payload?: unknown }): void;
  setState(state: unknown): void;
  getState(): unknown;
}
