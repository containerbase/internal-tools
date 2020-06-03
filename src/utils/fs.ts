import findUp = require('find-up');
import { promises as fs } from 'fs';
import { safeLoad } from 'js-yaml';
import { join } from 'upath';

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

export async function readJson<T = unknown>(file: string): Promise<T> {
  const path = join(process.cwd(), file);
  const res = (await import(path)) as T | { default: T };
  // istanbul ignore next
  return 'default' in res ? res?.default : res;
}

export async function readFile(file: string): Promise<string> {
  const path = join(process.cwd(), file);
  return await fs.readFile(path, 'utf8');
}

export async function readLocalYaml<T = unknown>(file: string): Promise<T> {
  const path = await resolveFile(file);
  const res = await fs.readFile(path, 'utf-8');
  return safeLoad(res, { json: true }) as T;
}
