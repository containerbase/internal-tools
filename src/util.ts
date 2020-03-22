import { exec as _exec } from '@actions/exec';
import { ExecOptions as _ExecOptions } from '@actions/exec/lib/interfaces';
import log from 'fancy-log';
import { getInput } from '@actions/core';

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

  const code = await _exec(cmd, args, {
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

  if (code) {
    log.error({ code, stdout, stderr });
    throw new Error('Command failed');
  }

  return { code, stdout, stderr };
}

export function isDryRun(): boolean {
  const val = getInput('dry-run');
  return !!val && val === 'true';
}
