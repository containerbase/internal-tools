import { existsSync } from 'fs';
import { platform } from 'os';
import { join } from 'path';
import { exec } from '../../util';
import { resolveFile } from '../fs';
import log from '../logger';
import { docker, dockerBuildx, dockerRun } from './common';

export async function init(): Promise<void> {
  const buildx = join(
    process.env.HOME as string,
    `.docker/cli-plugins/docker-buildx`
  );

  // istanbul ignore if
  if (platform() !== 'linux') {
    log.warn('Buildx support only on linux');
    return;
  }

  // istanbul ignore if
  if (existsSync(buildx)) {
    log('Buildx already initialized');
    return;
  }

  log.info('Configure buildx');

  const file = await resolveFile('bin/configure-docker.sh');
  await exec(file, []);

  await docker('info');
  await dockerBuildx('version');

  await dockerRun(
    '--privileged',
    'multiarch/qemu-user-static',
    '--reset',
    '-p',
    'yes'
  );

  await dockerBuildx(
    'create',
    '--name',
    'renovatebot-builder',
    '--driver',
    'docker-container',
    '--use'
  );

  await dockerBuildx('inspect', '--bootstrap');
}
