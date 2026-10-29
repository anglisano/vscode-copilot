import assert from 'node:assert/strict';
import { buildEdgeArgs } from '../../src/copilotAppWindow';
import { COPILOT_WEB_URL, resolveCopilotUrl } from '../../src/constants';
import { breakUrls, buildContextPrompt, buildSelectionPrompt, isProbablyBinary, languageFromPath } from '../../src/prompt';

describe('constants', () => {
  it('uses the Microsoft Copilot URL', () => {
    const url = new URL(COPILOT_WEB_URL);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'copilot.cloud.microsoft');
    assert.equal(url.pathname, '/');
  });

  it('only allows known Copilot URLs', () => {
    assert.equal(resolveCopilotUrl('https://copilot.microsoft.com/'), 'https://copilot.microsoft.com/');
    assert.equal(resolveCopilotUrl('https://evil.example/'), COPILOT_WEB_URL);
    assert.equal(resolveCopilotUrl(undefined), COPILOT_WEB_URL);
  });
});

describe('copilotAppWindow', () => {
  it('builds Edge app arguments', () => {
    assert.deepEqual(buildEdgeArgs(COPILOT_WEB_URL, ''), [`--app=${COPILOT_WEB_URL}`]);
    assert.deepEqual(buildEdgeArgs(COPILOT_WEB_URL, ' Profile 1 '), [`--app=${COPILOT_WEB_URL}`, '--profile-directory=Profile 1']);
  });
});

describe('prompt', () => {
  it('builds the selection prompt', () => {
    assert.equal(
      buildSelectionPrompt('Explain this {language} code:', 'python', 'print(1)'),
      'Explain this python code:\n\n```python\nprint(1)\n```'
    );
  });

  it('uses a longer fence when the selection contains backticks', () => {
    const prompt = buildSelectionPrompt('Review:', 'markdown', '```js\nx\n```');
    assert.ok(prompt.startsWith('Review:\n\n````markdown\n'));
    assert.ok(prompt.endsWith('\n````'));
  });

  it('detects the fence language from the file extension', () => {
    assert.equal(languageFromPath('src/app.TS'), 'ts');
    assert.equal(languageFromPath('lib/models/user.py'), 'py');
    assert.equal(languageFromPath('Dockerfile'), '');
    assert.equal(languageFromPath('config/.gitignore'), '');
  });

  it('flags binary content', () => {
    assert.equal(isProbablyBinary('plain text'), false);
    assert.equal(isProbablyBinary('PNG\0\0data'), true);
  });

  it('builds the context prompt with one block per file', () => {
    const prompt = buildContextPrompt('Context:', [
      { path: 'src/a.ts', content: 'export const a = 1;' },
      { path: 'app.py', content: 'print(1)' }
    ]);
    assert.equal(
      prompt,
      'Context:\n\n### src/a.ts\n```ts\nexport const a = 1;\n```\n\n### app.py\n```py\nprint(1)\n```\n\nQuestion: '
    );
  });
});

describe('breakUrls', () => {
  it('breaks the scheme and host dots but keeps the path', () => {
    assert.equal(
      breakUrls('"url": "https://api.example.com/mcp/context7.json"'),
      '"url": "https[:]//api[.]example[.]com/mcp/context7.json"'
    );
  });

  it('handles ports, IPs and comments', () => {
    assert.equal(breakUrls('// http://127.0.0.1:33418'), '// http[:]//127[.]0[.]0[.]1:33418');
  });

  it('handles URLs inside other schemes and www hosts', () => {
    assert.equal(breakUrls('jdbc:postgresql://db.local:5432/app'), 'jdbc:postgresql[:]//db[.]local:5432/app');
    assert.equal(breakUrls('see www.example.com/docs'), 'see www[.]example[.]com/docs');
  });

  it('leaves text without URLs untouched and is idempotent', () => {
    const code = 'const total = order.items.length; // see README.md';
    assert.equal(breakUrls(code), code);
    const broken = breakUrls('https://www.example.com');
    assert.equal(broken, 'https[:]//www[.]example[.]com');
    assert.equal(breakUrls(broken), broken);
  });
});
