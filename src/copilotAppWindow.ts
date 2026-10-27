import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

export function findEdge(): string | undefined {
  const candidates: string[] = [];
  if (process.platform === 'win32') {
    for (const base of [process.env['ProgramFiles(x86)'], process.env['ProgramFiles'], process.env['LOCALAPPDATA']]) {
      if (base) {
        candidates.push(path.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
      }
    }
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
  } else {
    candidates.push('/usr/bin/microsoft-edge', '/usr/bin/microsoft-edge-stable');
  }
  return candidates.find((candidate) => existsSync(candidate));
}

export function buildEdgeArgs(url: string, profile: string): string[] {
  const args = [`--app=${url}`];
  if (profile.trim()) {
    args.push(`--profile-directory=${profile.trim()}`);
  }
  return args;
}

export function launchEdgeApp(url: string, profile: string): Promise<boolean> {
  const edge = findEdge();
  if (!edge) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const child = spawn(edge, buildEdgeArgs(url, profile), { detached: true, stdio: 'ignore' });
    child.once('spawn', () => {
      child.unref();
      resolve(true);
    });
    child.once('error', () => resolve(false));
  });
}
