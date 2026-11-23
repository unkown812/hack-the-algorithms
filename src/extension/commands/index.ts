import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import {
  AI_EDITOR_COMMANDS,
  AI_MESSAGES,
  COMMAND_OPEN_AI_ASSISTANT,
  COMMAND_OPEN_DASHBOARD,
  COMMAND_OPEN_ONBOARDING,
  COMMAND_OPEN_ALGORITHM_LIBRARY,
  COMMAND_OPEN_PRACTICE,
  PLAYGROUND_MESSAGES,
  PRACTICE_MESSAGES,
  WEBVIEW_VIEW_TYPE,
} from '../../shared/constants';
import { getAllAlgorithms, getAlgorithmById } from '../../core/algorithms';
import { PlaygroundMessageHandler } from '../playground/message-handler';
import { PracticeMessageHandler } from '../practice/message-handler';
import { AIMessageHandler, getSelectedCode } from '../ai/message-handler';
import { ApprovedQuestionService } from '../services/ApprovedQuestionService';

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

/** Message types that belong to the Phase 7 AI assistant. */
const AI_MESSAGE_SET = new Set<string>([
  AI_MESSAGES.GET_AI_STATUS,
  AI_MESSAGES.SAVE_AI_CONFIG,
  AI_MESSAGES.SET_API_KEY,
  AI_MESSAGES.CLEAR_API_KEY,
  AI_MESSAGES.TEST_PROVIDER,
  AI_MESSAGES.ASK_ASSISTANT,
  AI_MESSAGES.CANCEL_AI_REQUEST,
  AI_MESSAGES.GET_CONVERSATIONS,
  AI_MESSAGES.NEW_CONVERSATION,
  AI_MESSAGES.OPEN_CONVERSATION,
  AI_MESSAGES.DELETE_CONVERSATION,
  AI_MESSAGES.CLEAR_CONVERSATIONS,
  AI_MESSAGES.SET_CONVERSATION_MODE,
  AI_MESSAGES.GENERATE_VIVA,
  AI_MESSAGES.GENERATE_QUESTIONS,
  AI_MESSAGES.GET_LEARNING_ADVICE,
]);

let dashboardPanel: vscode.WebviewPanel | undefined = undefined;
/**
 * Messages that are sent while the webview of a freshly created dashboard
 * panel is not ready yet. They are flushed once the webview signals readiness.
 */
let pendingWebviewMessages: Array<{ type: string; payload?: unknown }> = [];

function getWebviewOptions(
  context: vscode.ExtensionContext
): vscode.WebviewOptions {
  return {
    enableScripts: true,
    localResourceRoots: [
      vscode.Uri.joinPath(context.extensionUri, 'dist'),
      vscode.Uri.joinPath(context.extensionUri, 'media'),
      vscode.Uri.joinPath(context.extensionUri, 'resources'),
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

function postDashboardMessage(message: { type: string; payload?: unknown }): void {
  const panel = dashboardPanel;
  if (!panel) {
    pendingWebviewMessages.push(message);
    return;
  }
  void panel.webview.postMessage(message);
}

async function openDashboard(context: vscode.ExtensionContext, openView?: string): Promise<void> {
  const column = vscode.ViewColumn.One;

  // The reviewed questions of the student are shared by the assistant and
  // the practice centre.
  const approvedQuestions = new ApprovedQuestionService(context);

  if (dashboardPanel) {
    dashboardPanel.reveal(column);
    if (openView) {
      postDashboardMessage({ type: 'OPEN_VIEW', payload: { view: openView } });
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

  const webviewReady = new Promise<void>((resolve) => {
    const disposable = dashboardPanel!.webview.onDidReceiveMessage((message) => {
      if (message.type === 'DAA_WEBVIEW_READY') {
        disposable.dispose();
        resolve();
      }
    });
    context.subscriptions.push(disposable);
  });

  void webviewReady.then(() => {
    const pending = pendingWebviewMessages;
    pendingWebviewMessages = [];
    for (const message of pending) {
      void dashboardPanel?.webview.postMessage(message);
    }
  });

  // Deep links sent to a freshly created panel are queued until the webview
  // signals that it is ready to receive messages.
  if (openView) {
    pendingWebviewMessages.push({ type: 'OPEN_VIEW', payload: { view: openView } });
  }

  const playground = new PlaygroundMessageHandler(context, (message) => {
    postDashboardMessage(message);
  });
  context.subscriptions.push({ dispose: () => void playground.dispose() });

  const practice = new PracticeMessageHandler(context, (message) => {
    postDashboardMessage(message);
  }, () => approvedQuestions.getQuestions());

  const assistant = new AIMessageHandler(context, (message) => {
    postDashboardMessage(message);
  }, approvedQuestions);

  dashboardPanel.webview.onDidReceiveMessage(
    (message) => {
      switch (message.type) {
      case 'GET_ALGORITHMS': {
        const algorithms = getAllAlgorithms();
        postDashboardMessage({
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
        postDashboardMessage({
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
          break;
        }
        // Phase 7 messages are handled by the AI assistant.
        if (AI_MESSAGE_SET.has(message.type)) {
          void assistant.handle(message);
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
  const nonce = randomUUID();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src 'self' data:;">
  <title>DAA Learning Companion</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background-color: var(--vscode-editor-background, #0f172a);
    }
  </style>
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
    async () => {
      await openDashboard(context);
    }
  );

  const openAlgorithmLibraryCommand = vscode.commands.registerCommand(
    COMMAND_OPEN_ALGORITHM_LIBRARY,
    async () => {
      await openDashboard(context, 'library');
    }
  );

  const openPracticeCommand = vscode.commands.registerCommand(
    COMMAND_OPEN_PRACTICE,
    async () => {
      await openDashboard(context, 'practice');
    }
  );

  const openAIAssistantCommand = vscode.commands.registerCommand(
    COMMAND_OPEN_AI_ASSISTANT,
    async () => {
      await openDashboard(context, 'ai-assistant');
    }
  );

  const openOnboardingCommand = vscode.commands.registerCommand(
    COMMAND_OPEN_ONBOARDING,
    async () => {
      await openDashboard(context, 'onboarding');
    }
  );

  /**
   * The editor commands of the AI code explainer.
   * They read the selection, open the assistant and hand the code to it —
   * the source file itself is never uploaded automatically.
   */
  const editorActions: Record<
    string,
    { action: string; question?: string }
  > = {
    [AI_EDITOR_COMMANDS.EXPLAIN_SELECTION]: { action: 'explain' },
    [AI_EDITOR_COMMANDS.EXPLAIN_FUNCTION]: { action: 'function' },
    [AI_EDITOR_COMMANDS.GENERATE_PSEUDOCODE]: { action: 'pseudocode' },
    [AI_EDITOR_COMMANDS.FIND_BUGS]: { action: 'bugs' },
    [AI_EDITOR_COMMANDS.SUGGEST_IMPROVEMENTS]: { action: 'improve' },
    [AI_EDITOR_COMMANDS.EXPLAIN_COMPLEXITY]: { action: 'complexity' },
    [AI_EDITOR_COMMANDS.GENERATE_DOCUMENTATION]: { action: 'document' },
  };

  const editorCommands = Object.entries(editorActions).map(([commandId, spec]) =>
    vscode.commands.registerCommand(commandId, () => {
      const selection = getSelectedCode();
      if (!selection) {
        void vscode.window.showInformationMessage(
          'Select the code you want the assistant to explain and run the command again.'
        );
        return;
      }
      openDashboard(context, 'ai-assistant').then(() => {
        postDashboardMessage({
          type: AI_MESSAGES.AI_EDITOR_REQUEST,
          payload: { ...spec, ...selection },
        });
      });
    })
  );

  context.subscriptions.push(
    openDashboardCommand,
    openAlgorithmLibraryCommand,
    openPracticeCommand,
    openAIAssistantCommand,
    openOnboardingCommand,
    ...editorCommands
  );
}
