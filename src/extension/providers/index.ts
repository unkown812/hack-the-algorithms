import * as vscode from 'vscode';
import { VIEW_EXPLORER_ID } from '../../shared/constants';
import { getAllAlgorithms } from '../../core/algorithms';

export class AlgorithmExplorerProvider
implements vscode.TreeDataProvider<AlgorithmExplorerItem>, vscode.Disposable
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    AlgorithmExplorerItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(context: vscode.ExtensionContext) {
    context.subscriptions.push(this);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AlgorithmExplorerItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AlgorithmExplorerItem): vscode.ProviderResult<AlgorithmExplorerItem[]> {
    const algorithms = getAllAlgorithms();

    if (!element) {
      const categories = [...new Set(algorithms.map((a) => a.category))];

      // The practice centre is the first entry of the activity bar view.
      const practiceItem = new AlgorithmExplorerItem(
        'practice-centre',
        'Practice Centre',
        vscode.TreeItemCollapsibleState.None
      );
      practiceItem.iconPath = new vscode.ThemeIcon('school');
      practiceItem.tooltip = 'Quizzes, coding challenges, practical preparation and your progress';
      practiceItem.command = {
        command: 'daa-companion.openPractice',
        title: 'Open the practice centre',
      };

      return [
        practiceItem,
        ...categories.map(
          (category) =>
            new AlgorithmExplorerItem(
              category,
              category.charAt(0).toUpperCase() + category.slice(1),
              vscode.TreeItemCollapsibleState.Collapsed
            )
        ),
      ];
    }

    return algorithms
      .filter((a) => a.category === element.label?.toLowerCase())
      .map(
        (algo) =>
          new AlgorithmExplorerItem(
            algo.id,
            algo.name,
            vscode.TreeItemCollapsibleState.None,
            algo
          )
      );
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}

export class AlgorithmExplorerItem extends vscode.TreeItem {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly algorithm?: { id: string; name: string }
  ) {
    super(label, collapsibleState);

    if (algorithm) {
      this.command = {
        command: 'daa-companion.openDashboard',
        title: 'Open Algorithm',
        arguments: [algorithm.id],
      };
      this.iconPath = new vscode.ThemeIcon('book');
      this.tooltip = `${algorithm.name} - ${algorithm.id}`;
    } else {
      this.iconPath = new vscode.ThemeIcon('folder');
    }
  }
}

export function registerProviders(context: vscode.ExtensionContext): void {
  const provider = new AlgorithmExplorerProvider(context);

  const disposable = vscode.window.registerTreeDataProvider(VIEW_EXPLORER_ID, provider);

  context.subscriptions.push(disposable);
}
