import is from '@sindresorhus/is';
import { getArg, isDryRun, readJson } from '../../util';
import { readDockerConfig } from '../../utils/config';
import { dockerBuildx } from '../../utils/docker/common';
import log from '../../utils/logger';
import { BinaryBuilderConfig, ConfigFile } from '../../utils/types';

export async function getConfig(file: string): Promise<BinaryBuilderConfig> {
  const cfg = await readJson<ConfigFile>(file);

  await readDockerConfig(cfg);

  return {
    ...cfg,
    ignoredVersions: cfg.ignoredVersions ?? [],
    dryRun: isDryRun(),
    lastOnly: getArg('last-only') == 'true',
    buildArgs: getArg('build-args', { multi: true }),
  } as BinaryBuilderConfig;
}

export async function createBuilderImage(
  ws: string,
  { buildArgs }: BinaryBuilderConfig
): Promise<void> {
  log('Creating builder image');
  const args = ['build', '--load', '-t', 'builder'];
  if (is.nonEmptyArray(buildArgs)) {
    args.push(...buildArgs.map((b) => `--build-arg=${b}`));
  }
  await dockerBuildx(...args, ws);
}
