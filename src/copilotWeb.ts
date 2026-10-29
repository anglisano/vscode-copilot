import * as vscode from 'vscode';
import { launchEdgeApp } from './copilotAppWindow';
import { resolveCopilotUrl } from './constants';
import { breakUrls, buildSelectionPrompt, DEFAULT_SELECTION_PROMPT } from './prompt';

export { COPILOT_WEB_URL } from './constants';

function getConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration('copilotWeb');
}

function getCopilotUrl(): string {
  return resolveCopilotUrl(getConfig().get<string>('url'));
}

export async function openCopilotExternally(): Promise<void> {
  const opened = await vscode.env.openExternal(vscode.Uri.parse(getCopilotUrl()));
  if (!opened) {
    void vscode.window.showErrorMessage('Could not open Microsoft Copilot in the browser.');
  }
}

export async function openCopilot(): Promise<void> {
  const config = getConfig();
  if (config.get<string>('openMode') === 'browser') {
    await openCopilotExternally();
    return;
  }
  const launched = await launchEdgeApp(getCopilotUrl(), config.get<string>('edgeProfile', ''));
  if (!launched) {
    void vscode.window.showWarningMessage('Microsoft Edge was not found. Opening Microsoft Copilot in the default browser.');
    await openCopilotExternally();
  }
}

export function pasteShortcut(): string {
  return process.platform === 'darwin' ? 'Cmd+V' : 'Ctrl+V';
}

export async function askAboutSelection(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  const text = editor
    ? editor.selections.map((selection) => editor.document.getText(selection)).filter((part) => part.trim()).join('\n\n')
    : '';
  if (!editor || !text) {
    void vscode.window.showWarningMessage('Select some text in the editor first.');
    return;
  }

  const config = getConfig();
  const rawPrompt = buildSelectionPrompt(config.get<string>('selectionPrompt', DEFAULT_SELECTION_PROMPT), editor.document.languageId, text);
  await vscode.env.clipboard.writeText(config.get<boolean>('breakUrls', true) ? breakUrls(rawPrompt) : rawPrompt);
  await openCopilot();
  void vscode.window.showInformationMessage(`Prompt copied to the clipboard. Paste it into Microsoft Copilot with ${pasteShortcut()}.`);
}
