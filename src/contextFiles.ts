import * as vscode from 'vscode';
import { openCopilot, pasteShortcut } from './copilotWeb';
import { buildContextPrompt, ContextFile, DEFAULT_CONTEXT_PROMPT, isProbablyBinary } from './prompt';

const MAX_FILE_BYTES = 1024 * 1024;
const MAX_CANDIDATES = 5000;

interface FileItem extends vscode.QuickPickItem {
  uri: vscode.Uri;
}

function getConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration('copilotWeb');
}

function enabledGlobs(setting: string): string[] {
  const value = vscode.workspace.getConfiguration().get<Record<string, unknown>>(setting) ?? {};
  return Object.entries(value).filter(([, enabled]) => enabled === true).map(([glob]) => glob);
}

function openTabUris(): vscode.Uri[] {
  const active = vscode.window.activeTextEditor?.document.uri;
  const tabs = vscode.window.tabGroups.all
    .flatMap((group) => group.tabs)
    .map((tab) => tab.input)
    .filter((input): input is vscode.TabInputText => input instanceof vscode.TabInputText)
    .map((input) => input.uri);
  return (active ? [active, ...tabs] : tabs).filter((uri) => uri.scheme === 'file');
}

async function filesOnly(uris: readonly vscode.Uri[]): Promise<vscode.Uri[]> {
  const files: vscode.Uri[] = [];
  for (const uri of uris) {
    try {
      if ((await vscode.workspace.fs.stat(uri)).type & vscode.FileType.File) {
        files.push(uri);
      }
    } catch {
      // Ignore entries that no longer exist.
    }
  }
  return files;
}

async function pickContextFiles(explorerFiles: readonly vscode.Uri[]): Promise<vscode.Uri[] | undefined> {
  if (!vscode.workspace.workspaceFolders?.length) {
    void vscode.window.showWarningMessage('Open a folder to pick context files.');
    return undefined;
  }

  // An explicit exclude disables files.exclude, so merge it back in together with search.exclude.
  const excludes = [
    ...enabledGlobs('files.exclude'),
    ...enabledGlobs('search.exclude'),
    ...getConfig().get<string[]>('contextExclude', [])
  ];
  const found = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Window, title: 'Finding files…' },
    () => vscode.workspace.findFiles('**/*', excludes.length ? `{${excludes.join(',')}}` : undefined, MAX_CANDIDATES)
  );

  const preselectedKeys = new Set<string>();
  const preselected = [...explorerFiles, ...openTabUris()].filter(
    (uri) => !preselectedKeys.has(uri.toString()) && preselectedKeys.add(uri.toString())
  );
  const rest = found
    .filter((uri) => !preselectedKeys.has(uri.toString()))
    .sort((a, b) => vscode.workspace.asRelativePath(a).localeCompare(vscode.workspace.asRelativePath(b)));

  const toItem = (uri: vscode.Uri, picked: boolean): FileItem => {
    const relative = vscode.workspace.asRelativePath(uri);
    const slash = relative.lastIndexOf('/');
    return {
      uri,
      picked,
      label: slash >= 0 ? relative.slice(slash + 1) : relative,
      description: slash >= 0 ? relative.slice(0, slash) : undefined,
      iconPath: vscode.ThemeIcon.File
    };
  };
  const items = [...preselected.map((uri) => toItem(uri, true)), ...rest.map((uri) => toItem(uri, false))];

  const picked = await vscode.window.showQuickPick(items, {
    canPickMany: true,
    matchOnDescription: true,
    title: 'Context files for Microsoft Copilot',
    placeHolder: 'Selected and open files are preselected. Type to search, Space to toggle, Enter to copy.'
  });
  return picked?.map((item) => item.uri);
}

async function readContextFiles(uris: readonly vscode.Uri[]): Promise<{ files: ContextFile[]; skipped: string[] }> {
  const files: ContextFile[] = [];
  const skipped: string[] = [];
  for (const uri of uris) {
    const path = vscode.workspace.asRelativePath(uri);
    const openDocument = vscode.workspace.textDocuments.find((document) => document.uri.toString() === uri.toString());
    if (openDocument) {
      files.push({ path, content: openDocument.getText() });
      continue;
    }
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      if (stat.type & vscode.FileType.Directory || stat.size > MAX_FILE_BYTES) {
        skipped.push(path);
        continue;
      }
      const content = new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
      if (isProbablyBinary(content)) {
        skipped.push(path);
        continue;
      }
      files.push({ path, content });
    } catch {
      skipped.push(path);
    }
  }
  return { files, skipped };
}

export async function askWithContextFiles(_uri?: vscode.Uri, explorerSelection?: unknown): Promise<void> {
  // Explorer passes the multi-selection as an array; editor menus pass other arguments.
  const explorerFiles = Array.isArray(explorerSelection) ? await filesOnly(explorerSelection as vscode.Uri[]) : [];
  const uris = await pickContextFiles(explorerFiles);
  if (!uris?.length) {
    return;
  }

  const { files, skipped } = await readContextFiles(uris);
  if (!files.length) {
    void vscode.window.showWarningMessage('None of the selected files could be read as text.');
    return;
  }

  const config = getConfig();
  const prompt = buildContextPrompt(config.get<string>('contextPrompt', DEFAULT_CONTEXT_PROMPT), files);
  const maxChars = config.get<number>('contextMaxChars', 30000);
  if (prompt.length > maxChars) {
    const choice = await vscode.window.showWarningMessage(
      `The context is ${prompt.length.toLocaleString()} characters, above the ${maxChars.toLocaleString()} limit. Microsoft Copilot may reject or cut it.`,
      { modal: true },
      'Copy Anyway'
    );
    if (choice !== 'Copy Anyway') {
      return;
    }
  }

  await vscode.env.clipboard.writeText(prompt);
  await openCopilot();
  const skippedNote = skipped.length ? ` Skipped (folder, binary or too large): ${skipped.join(', ')}.` : '';
  void vscode.window.showInformationMessage(
    `Copied ${files.length} file(s), ${prompt.length.toLocaleString()} characters. Paste with ${pasteShortcut()} and write your question.${skippedNote}`
  );
}
