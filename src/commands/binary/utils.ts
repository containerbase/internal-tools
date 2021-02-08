import { getArg, getUbuntuFlavor, isDryRun, readJson } from '../../util';
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
  } as BinaryBuilderConfig;
}

export async function createBuilderImage(ws: string): Promise<void> {
  const flavor = getUbuntuFlavor();
  log('Creating builder for flavor', flavor);
  await dockerBuildx(
    'build',
    '--load',
    '-t',
    'builder',
    '--build-arg',
    flavor,
    ws
  );
}
