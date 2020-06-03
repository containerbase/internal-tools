import { endGroup, getInput, startGroup } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { ExecOptions as _ExecOptions } from '@actions/exec/lib/interfaces';
import { getEnv } from './utils/env';
import { ExecError, ExecResult } from './utils/types';

export type ExecOptions = _ExecOptions;

export async function exec(
  cmd: string,
  args: string[],
  options?: ExecOptions
): Promise<ExecResult> {
  let stdout = '';
  let stderr = '';
  let code: number;

  try {
    startGroup(`${cmd} ${args.join(' ')}`);
    code = await _exec(cmd, args, {
      ...options,
      ignoreReturnCode: true,
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
    throw new ExecError(code, stdout, stderr, `${cmd} ${args.join(' ')}`);
  }

  return { code, stdout, stderr };
}

export function isCI(): boolean {
  return !!getEnv('CI');
}

export function isDryRun(): boolean {
  const val = getInput('dry-run') || getEnv('DRY_RUN');
  return (!!val && val === 'true') || !isCI();
}

export function getWorkspace(): string {
  return getEnv('GITHUB_WORKSPACE') || process.cwd();
}
