export const COPILOT_WEB_URL = 'https://copilot.cloud.microsoft/';

export const ALLOWED_COPILOT_URLS: readonly string[] = [
  COPILOT_WEB_URL,
  'https://copilot.microsoft.com/'
];

export function resolveCopilotUrl(configured: string | undefined): string {
  return configured && ALLOWED_COPILOT_URLS.includes(configured) ? configured : COPILOT_WEB_URL;
}