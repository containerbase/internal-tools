import { exec as _exec } from '@actions/exec';
import { ExecOptions as _ExecOptions } from '@actions/exec/lib/interfaces';
import log from './utils/logger';
import { getInput, startGroup, endGroup } from '@actions/core';
import { join } from 'path';

export type ExecOptions = _ExecOptions;

export type ExecResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

export async function exec(
  cmd: string,
  args: string[],
  options?: ExecOptions
): Promise<ExecResult> {
  let stdout = '';
  let stderr = '';
  let code: number;

  try {
    startGroup(cmd);
    code = await _exec(cmd, args, {
      ...options,
      listeners: {
        stdout: (data: Buffer) => {
          stdout += data.toString();
        },
        stderr: (data: Buffer) => {
          stderr += data.toString();
        },
      },
    });
  } finally {
    endGroup();
  }
  if (code) {
    log.error({ code });
    throw new Error('Command failed');
  }

  return { code, stdout, stderr };
}

export function isDryRun(): boolean {
  const val = getInput('dry-run');
  return !!val && val === 'true';
}

/**
 * Get environment variable or empty string.
 * Used for easy mocking.
 * @param key variable name
 */
export function getEnv(key: string): string {
  return process.env[key] ?? '';
}

export async function readJson<T = unknown>(file: string): Promise<T> {
  const path = join(getEnv('GITHUB_WORKSPACE'), file);
  const res = await import(path);
  // istanbul ignore next
  return res?.default ?? res;
}
