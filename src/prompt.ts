export const DEFAULT_SELECTION_PROMPT = 'Explain this {language} code:';
export const DEFAULT_CONTEXT_PROMPT = 'Use these files as context for my question:';

export interface ContextFile {
  path: string;
  content: string;
}

export function fencedBlock(text: string, language: string): string {
  // Use a fence longer than any backtick run in the text so it cannot be closed early.
  const longestRun = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(Math.max(3, longestRun + 1));
  return `${fence}${language}\n${text}\n${fence}`;
}

export function buildSelectionPrompt(template: string, languageId: string, text: string): string {
  const header = template.replace(/\{language\}/g, languageId);
  return `${header}\n\n${fencedBlock(text, languageId)}`;
}

export function languageFromPath(filePath: string): string {
  const name = filePath.split('/').pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function isProbablyBinary(content: string): boolean {
  return content.includes('\0');
}

export function buildContextPrompt(header: string, files: readonly ContextFile[]): string {
  const blocks = files.map((file) => `### ${file.path}\n${fencedBlock(file.content, languageFromPath(file.path))}`);
  return `${header}\n\n${blocks.join('\n\n')}\n\nQuestion: `;
}

const HOST = String.raw`[^\s/?#"'\`<>()\[\]{},;]+`;
const URL_WITH_SCHEME = new RegExp(String.raw`\b([a-z][a-z0-9+.-]*)://(${HOST})`, 'gi');
const WWW_HOST = new RegExp(String.raw`\bwww\.(${HOST})`, 'gi');

export function breakUrls(text: string): string {
  // Defanging the host as well as the scheme stops bare-domain link detection too.
  return text
    .replace(URL_WITH_SCHEME, (_match, scheme: string, host: string) => `${scheme}[:]//${host.replace(/\./g, '[.]')}`)
    .replace(WWW_HOST, (_match, host: string) => `www[.]${host.replace(/\./g, '[.]')}`);
}
