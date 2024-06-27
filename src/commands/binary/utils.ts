import { getInput } from '@actions/core';
import {
  isNonEmptyArray,
  isNonEmptyString,
  isObject,
  isString,
} from '@sindresorhus/is';
import { getDefaultVersioning } from 'renovate/dist/modules/datasource/common';
import { getArch, getArg, getDistro, isDryRun, readJson } from '../../util';
import { readDockerConfig } from '../../utils/config';
import {
  DockerArch,
  DockerPlatform,
  dockerBuildx,
  dockerRun,
} from '../../utils/docker/common';
import log from '../../utils/logger';
import type { BinaryBuilderConfig, ConfigFile } from '../../utils/types';

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
