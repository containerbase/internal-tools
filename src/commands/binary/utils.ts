import { resolve } from 'node:path';
import { getInput } from '@actions/core';
import {
  isNonEmptyArray,
  isNonEmptyString,
  isObject,
  isString,
} from '@sindresorhus/is';
import { getDefaultVersioning } from 'renovate/dist/modules/datasource/common';
import {
  exec,
  getArch,
  getArg,
  getDistro,
  isDryRun,
  readJson,
} from '../../util';
import { getBinaryName, readDockerConfig } from '../../utils/config';
import {
  DockerArch,
  DockerPlatform,
  dockerBuildx,
  dockerRun,
} from '../../utils/docker/common';
import log from '../../utils/logger';
import type { BinaryBuilderConfig, ConfigFile } from '../../utils/types';

const defaultBuildLimit = 99;

/**
 * Reads the `build-limit` input.
 * Returns the default when it's empty and throws when it isn't a positive integer.
 */
function getBuildLimit(): number {
  const value = getArg('build-limit');
  if (!isNonEmptyString(value)) {
    return defaultBuildLimit;
  }
  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error(`Invalid build-limit: ${value}`);
  }
  return limit;
}

/**
 * Reads the binary builder config from the config file and the action inputs.
 */
export async function getConfig(): Promise<BinaryBuilderConfig> {
  const configFile = getInput('config') || 'builder.json';

  const cfg = await readJson<ConfigFile>(configFile);

  if (!isObject(cfg)) {
    throw new Error('missing-config');
  }

  if (!isString(cfg.image)) {
    cfg.image = getInput('image', { required: true });
  }

  if (!isString(cfg.buildArg)) {
    cfg.buildArg = cfg.image.toUpperCase() + '_VERSION';
  }

  await readDockerConfig(cfg);

  return {
    ...cfg,
    ignoredVersions: cfg.ignoredVersions ?? [],
    dryRun: isDryRun(),
    lastOnly: getArg('last-only') == 'true',
    buildArgs: getArg('build-args', { multi: true }),
    buildLimit: getBuildLimit(),
    versioning: cfg.versioning ?? getDefaultVersioning(cfg.datasource),
  } as BinaryBuilderConfig;
}

export async function createBuilderImage(
  ws: string,
  { buildArgs }: BinaryBuilderConfig,
): Promise<void> {
  log('Creating builder image');
  const args = ['build', '--load', '-t', 'builder'];
  const distro = getDistro();
  const arch = getArch();
  if (isNonEmptyString(distro)) {
    args.push('--build-arg', `DISTRO=${distro}`);
  }
  if (isNonEmptyString(arch)) {
    args.push('--platform', DockerPlatform[arch as DockerArch]);
  }
  if (isNonEmptyArray(buildArgs)) {
    args.push(...buildArgs.map((b) => `--build-arg=${b}`));
  }
  await dockerBuildx(...args, ws);
}

export async function runBuilder(ws: string, version: string): Promise<void> {
  const args = ['--name', 'builder', '--volume', `${ws}/.cache:/cache`];
  const arch = getArch();
  if (isNonEmptyString(arch)) {
    args.push('--platform', DockerPlatform[arch as DockerArch]);
  }
  await dockerRun(...args, 'builder', version);
}

/**
 * Runs the optional `test` script from the config against the freshly built archive.
 * The script gets the absolute archive path and the version as arguments and inherits
 * the environment, e.g. `DISTRO` and `ARCH`. Does nothing when no test is configured.
 */
export async function runTest(
  ws: string,
  cfg: BinaryBuilderConfig,
  version: string,
): Promise<void> {
  if (!isNonEmptyString(cfg.test)) {
    return;
  }
  const archive = resolve(ws, '.cache', getBinaryName(cfg, version));
  log.info('Running test:', version);
  try {
    await exec(resolve(ws, cfg.test), [archive, version], { cwd: ws });
  } catch (e) {
    log.error('Test failed:', version);
    throw e;
  }
}
