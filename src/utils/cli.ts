import { getInput as cli } from '@actions/core';
import { Command } from 'commander';
import { getEnv } from './env';
import { readLocalYaml } from './fs';

export function isCli(): boolean {
  return getEnv('GITHUB_ACTIONS') !== 'true';
}

export function getArgv(): string[] {
  return process.argv;
}

type Action = {
  inputs: Record<
    string,
    { description: string; required: boolean; default: string }
  >;
};

let _opts: Record<string, string> = {};

async function parse(): Promise<Record<string, string>> {
  const program = new Command()
    .storeOptionsAsProperties(false)
    .passCommandToAction(false)
    .arguments('<command> [image]');

  const action = await readLocalYaml<Action>('action.yml');

  for (const name of Object.keys(action.inputs).filter(
    (n) => !['command', 'image'].includes(n)
  )) {
    const val = action.inputs[name];

    if (val.required === true) {
      program.requiredOption(`--${name} <value>`, val.description, val.default);
    } else {
      program.option(`--${name} <value>`, val.description, val.default);
    }
  }

  return program.parse(getArgv()).opts();
}

export async function initCli(): Promise<void> {
  _opts = await parse();
}

export function getCliArg(name: string, required?: boolean): string {
  if (!_opts[name] && required) {
    throw Error(`Missing required argument ${name}`);
  }
  return _opts[name];
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
  const val = isCli() ? getCliArg(name, opts?.required) : cli(name, opts);
  return opts?.multi ? val.split(MultiArgsSplitRe).filter(Boolean) : val;
}
