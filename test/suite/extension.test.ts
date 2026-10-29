import assert from 'node:assert/strict';
import * as vscode from 'vscode';

const EXTENSION_ID = 'anglisano.copilot-web';
const COMMANDS = ['copilotWeb.open', 'copilotWeb.openExternal', 'copilotWeb.askAboutSelection', 'copilotWeb.askWithContext'];

describe('Copilot Web extension', () => {
  before(async () => {
    await vscode.extensions.getExtension(EXTENSION_ID)?.activate();
  });

  it('activates', () => {
    assert.ok(vscode.extensions.getExtension(EXTENSION_ID)?.isActive);
  });

  it('registers its commands', async () => {
    const registered = await vscode.commands.getCommands(true);
    for (const command of COMMANDS) {
      assert.ok(registered.includes(command), `${command} is not registered`);
    }
  });

  it('contributes the default settings', () => {
    const config = vscode.workspace.getConfiguration('copilotWeb');
    assert.equal(config.get('openMode'), 'appWindow');
    assert.equal(config.get('url'), 'https://copilot.cloud.microsoft/');
    assert.equal(config.get('showStatusBar'), true);
    assert.equal(config.get('contextMaxChars'), 30000);
    assert.equal(config.get('breakUrls'), true);
  });

  it('does not open Copilot when there is no selection', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await vscode.commands.executeCommand('copilotWeb.askAboutSelection');
  });
});
