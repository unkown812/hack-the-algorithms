import * as vscode from 'vscode';
import {
  COMMAND_OPEN_DASHBOARD,
  COMMAND_OPEN_ALGORITHM_LIBRARY,
  WEBVIEW_VIEW_TYPE,
} from '../../shared/constants';
import { getAllAlgorithms, getAlgorithmById } from '../../core/algorithms';

let dashboardPanel: vscode.WebviewPanel | undefined = undefined;

function getWebviewOptions(
  context: vscode.ExtensionContext
): vscode.WebviewOptions {
  return {
    enableScripts: true,
    localResourceRoots: [
      vscode.Uri.joinPath(context.extensionUri, 'dist'),
    ],
  };
}

function getWebviewUri(
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel
): vscode.Uri {
  return panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview.js')
  );
}

async function exportReport(
  content: string,
  fileName: string,
  languageId: string
): Promise<void> {
  const extension = fileName.split('.').pop() ?? 'txt';
  const label = languageId === 'markdown' ? 'Markdown' : languageId.toUpperCase();
  const filters: Record<string, string[]> = languageId ? { [label]: [extension] } : { 'All Files': ['*'] };

  const target = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(fileName),
    filters,
  });
  if (!target) {
    return;
  }
  await vscode.workspace.fs.writeFile(target, Buffer.from(content, 'utf8'));
  const doc = await vscode.workspace.openTextDocument(target);
  await vscode.window.showTextDocument(doc, { preview: true });
  await vscode.window.showInformationMessage(`Report exported: ${target.fsPath}`);
}

function openDashboard(context: vscode.ExtensionContext): void {
  const column = vscode.ViewColumn.One;

  if (dashboardPanel) {
    dashboardPanel.reveal(column);
    return;
  }

  dashboardPanel = vscode.window.createWebviewPanel(
    WEBVIEW_VIEW_TYPE,
    'DAA Learning Companion',
    column,
    getWebviewOptions(context)
  );

  dashboardPanel.webview.html = getWebviewContent(context, dashboardPanel);

  dashboardPanel.webview.onDidReceiveMessage(
    (message) => {
      switch (message.type) {
      case 'GET_ALGORITHMS': {
        const algorithms = getAllAlgorithms();
        dashboardPanel?.webview.postMessage({
          type: 'ALGORITHMS_DATA',
          payload: algorithms,
        });
        break;
      }
      case 'GET_ALGORITHM_DETAIL': {
        const { algorithmId } = (message.payload ?? {}) as {
            algorithmId: string;
          };
        const algo = getAlgorithmById(algorithmId);
        dashboardPanel?.webview.postMessage({
          type: 'ALGORITHM_DETAIL',
          payload: algo,
        });
        break;
      }
      case 'EXPORT_REPORT': {
        const { content, fileName, languageId } = (message.payload ?? {}) as {
          content: string;
          fileName: string;
          languageId: string;
        };
        void exportReport(content, fileName, languageId);
        break;
      }
      default:
        break;
      }
    },
    undefined,
    context.subscriptions
  );

  dashboardPanel.onDidDispose(() => {
    dashboardPanel = undefined;
  });
}

function getWebviewContent(
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel
): string {
  const webviewUri = getWebviewUri(context, panel);
  const nonce = 'daa-companion-nonce';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src 'self' data:;">
  <title>DAA Learning Companion</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${webviewUri}"></script>
</body>
</html>`;
}

export function registerCommands(context: vscode.ExtensionContext): void {
  const openDashboardCommand = vscode.commands.registerCommand(
    COMMAND_OPEN_DASHBOARD,
    () => openDashboard(context)
  );

  const openAlgorithmLibraryCommand = vscode.commands.registerCommand(
    COMMAND_OPEN_ALGORITHM_LIBRARY,
    () => openDashboard(context)
  );

  context.subscriptions.push(openDashboardCommand, openAlgorithmLibraryCommand);
}
