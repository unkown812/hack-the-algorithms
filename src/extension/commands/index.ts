import * as vscode from 'vscode';
import {
  COMMAND_OPEN_DASHBOARD,
  COMMAND_OPEN_ALGORITHM_LIBRARY,
  COMMAND_OPEN_PRACTICE,
  PLAYGROUND_MESSAGES,
  PRACTICE_MESSAGES,
  WEBVIEW_VIEW_TYPE,
} from '../../shared/constants';
import { getAllAlgorithms, getAlgorithmById } from '../../core/algorithms';
import { PlaygroundMessageHandler } from '../playground/message-handler';
import { PracticeMessageHandler } from '../practice/message-handler';

/** Message types that belong to the Phase 5 Code Playground. */
const PLAYGROUND_MESSAGE_SET = new Set<string>([
  PLAYGROUND_MESSAGES.GET_COMPILER_STATUS,
  PLAYGROUND_MESSAGES.REFRESH_COMPILER,
  PLAYGROUND_MESSAGES.UPDATE_COMPILER_CONFIG,
  PLAYGROUND_MESSAGES.COMPILE_PROGRAM,
  PLAYGROUND_MESSAGES.RUN_PROGRAM,
  PLAYGROUND_MESSAGES.STOP_PROGRAM,
  PLAYGROUND_MESSAGES.RUN_TESTS,
  PLAYGROUND_MESSAGES.SAVE_PROGRAM,
  PLAYGROUND_MESSAGES.LOAD_PROGRAM,
  PLAYGROUND_MESSAGES.OPEN_PROGRAM_FILE,
  PLAYGROUND_MESSAGES.DELETE_PROGRAM,
  PLAYGROUND_MESSAGES.LIST_PROGRAMS,
  PLAYGROUND_MESSAGES.SAVE_TEST_CASES,
  PLAYGROUND_MESSAGES.LOAD_TEST_CASES,
  PLAYGROUND_MESSAGES.GET_HISTORY,
  PLAYGROUND_MESSAGES.CLEAR_HISTORY,
  PLAYGROUND_MESSAGES.START_DEBUGGING,
  PLAYGROUND_MESSAGES.DEBUG_ACTION,
  PLAYGROUND_MESSAGES.STOP_DEBUGGING,
  PLAYGROUND_MESSAGES.GET_DEBUG_STATE,
]);

/** Message types that belong to the Phase 6 practice centre. */
const PRACTICE_MESSAGE_SET = new Set<string>([
  PRACTICE_MESSAGES.GET_PRACTICE_OVERVIEW,
  PRACTICE_MESSAGES.GET_QUESTIONS,
  PRACTICE_MESSAGES.START_QUIZ,
  PRACTICE_MESSAGES.ANSWER_QUIZ,
  PRACTICE_MESSAGES.MARK_QUESTION,
  PRACTICE_MESSAGES.SUBMIT_QUIZ,
  PRACTICE_MESSAGES.ABANDON_QUIZ,
  PRACTICE_MESSAGES.GET_ACTIVE_QUIZ,
  PRACTICE_MESSAGES.GET_CHALLENGES,
  PRACTICE_MESSAGES.GET_CHALLENGE,
  PRACTICE_MESSAGES.SUBMIT_CHALLENGE,
  PRACTICE_MESSAGES.GET_REFERENCE_SOLUTION,
  PRACTICE_MESSAGES.GET_PRACTICALS,
  PRACTICE_MESSAGES.GET_PRACTICAL,
  PRACTICE_MESSAGES.GET_MOCK_EXAMS,
  PRACTICE_MESSAGES.RECORD_MOCK_EXAM,
  PRACTICE_MESSAGES.GET_VIVA,
  PRACTICE_MESSAGES.TOGGLE_BOOKMARK,
  PRACTICE_MESSAGES.GET_BOOKMARKS,
  PRACTICE_MESSAGES.GET_PROGRESS,
  PRACTICE_MESSAGES.RESET_PROGRESS,
  PRACTICE_MESSAGES.EXPORT_PROGRESS,
  PRACTICE_MESSAGES.IMPORT_PROGRESS,
  PRACTICE_MESSAGES.RECORD_ALGORITHM_EXPLORED,
]);

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

function openDashboard(context: vscode.ExtensionContext, openView?: string): void {
  const column = vscode.ViewColumn.One;

  if (dashboardPanel) {
    dashboardPanel.reveal(column);
    if (openView) {
      void dashboardPanel.webview.postMessage({ type: 'OPEN_VIEW', payload: { view: openView } });
    }
    return;
  }

  dashboardPanel = vscode.window.createWebviewPanel(
    WEBVIEW_VIEW_TYPE,
    'DAA Learning Companion',
    column,
    getWebviewOptions(context)
  );

  dashboardPanel.webview.html = getWebviewContent(context, dashboardPanel);

  if (openView) {
    void dashboardPanel.webview.postMessage({ type: 'OPEN_VIEW', payload: { view: openView } });
  }

  const playground = new PlaygroundMessageHandler(context, (message) => {
    dashboardPanel?.webview.postMessage(message);
  });
  context.subscriptions.push({ dispose: () => void playground.dispose() });

  const practice = new PracticeMessageHandler(context, (message) => {
    dashboardPanel?.webview.postMessage(message);
  });

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
        // Phase 5 messages are handled by the playground bridge.
        if (PLAYGROUND_MESSAGE_SET.has(message.type)) {
          void playground.handle(message);
          break;
        }
        // Phase 6 messages are handled by the practice centre.
        if (PRACTICE_MESSAGE_SET.has(message.type)) {
          void practice.handle(message);
        }
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

  const openPracticeCommand = vscode.commands.registerCommand(
    COMMAND_OPEN_PRACTICE,
    () => openDashboard(context, 'practice')
  );

  context.subscriptions.push(
    openDashboardCommand,
    openAlgorithmLibraryCommand,
    openPracticeCommand
  );
}
