import * as vscode from 'vscode';
import { askWithContextFiles } from './contextFiles';
import { askAboutSelection, openCopilot, openCopilotExternally } from './copilotWeb';

export function activate(context: vscode.ExtensionContext): void {
  const statusBarItem = vscode.window.createStatusBarItem('copilotWeb.status', vscode.StatusBarAlignment.Right, 100);
  statusBarItem.name = 'Microsoft Copilot';
  statusBarItem.text = '$(comment-discussion) M365 Copilot';
  statusBarItem.tooltip = 'Open Microsoft Copilot';
  statusBarItem.command = 'copilotWeb.open';

  const updateStatusBar = (): void => {
    if (vscode.workspace.getConfiguration('copilotWeb').get<boolean>('showStatusBar', true)) {
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  };
  updateStatusBar();

  context.subscriptions.push(
    statusBarItem,
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('copilotWeb.showStatusBar')) {
        updateStatusBar();
      }
    }),
    vscode.commands.registerCommand('copilotWeb.open', openCopilot),
    vscode.commands.registerCommand('copilotWeb.openExternal', openCopilotExternally),
    vscode.commands.registerCommand('copilotWeb.askAboutSelection', askAboutSelection),
    vscode.commands.registerCommand('copilotWeb.askWithContext', askWithContextFiles)
  );
}

export function deactivate(): void {}
