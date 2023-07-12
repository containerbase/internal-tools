import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import type { DockerArch } from './utils/docker/common';
import { ExecError, ExecResult } from './utils/types';
import { endGroup, getInput, startGroup } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import type { ExecOptions as _ExecOptions } from '@actions/exec/lib/interfaces';
import { which } from '@actions/io';
import is from '@sindresorhus/is';
import * as findUp from 'find-up';

export type ExecOptions = _ExecOptions;

const DEFAULT_DISTRO = 'focal';

export async function exists(command: string): Promise<boolean> {
  try {
    await which(command, true);
  } catch {
    return false;
  }

  return true;
}

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

/**
 * Get environment variable or empty string.
 * Used for easy mocking.
 * @param key variable name
 */
export function getEnv(key: string): string {
  return process.env[key] ?? '';
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

export function getDistro(): string {
  return getEnv('DISTRO') || getEnv('FLAVOR') || DEFAULT_DISTRO;
}

export function getArch(): DockerArch {
  return getEnv('ARCH') as DockerArch;
}

export async function readJson<T = unknown>(file: string): Promise<T> {
  const json = await readFile(file);
  return JSON.parse(json) as T;
}

export async function readFile(file: string): Promise<string> {
  const path = join(getWorkspace(), file);
  return await fs.readFile(path, 'utf8');
}

export async function readBuffer(file: string): Promise<Buffer> {
  const path = join(getWorkspace(), file);
  return await fs.readFile(path);
}

export async function writeFile(
  file: string,
  contents: string | Buffer
): Promise<void> {
  const path = join(getWorkspace(), file);
  await fs.writeFile(path, contents);
}

export const MultiArgsSplitRe = /\s*(?:[;,]|$)\s*/;

export function getArg(name: string, opts?: { required?: boolean }): string;
export function getArg(
  name: string,
  opts?: { required?: boolean; multi: true }
): string[];
export function getArg(
  name: string,
  opts?: { required?: boolean; multi?: boolean }
): string | string[];
export function getArg(
  name: string,
  opts?: { required?: boolean; multi?: boolean }
): string | string[] {
  const val = getInput(name, opts);
  return opts?.multi
    ? val.split(MultiArgsSplitRe).filter(is.nonEmptyStringAndNotWhitespace)
    : val;
}

let _pkg: Promise<string | undefined>;

/**
 * Resolve path for a file relative to renovate root directory (our package.json)
 * @param file a file to resolve
 */
export async function resolveFile(file: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  if (!_pkg) {
    _pkg = findUp('package.json', { cwd: __dirname, type: 'file' });
  }
  const pkg = await _pkg;
  // istanbul ignore if
  if (!pkg) {
    throw new Error('Missing package.json');
  }
  return join(pkg, '../', file);
}

/**
 * Stop processing for some time.
 * @param milliseconds time to sleep
 */
export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
