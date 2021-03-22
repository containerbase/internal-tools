import log from '../logger';
import { docker, dockerBuildx, dockerRun } from './common';

const SupportedPlatforms = 'arm64';

export async function init(): Promise<void> {
  const buildx = await dockerBuildx('ls');

  if (buildx.stdout.includes('renovatebot-builder')) {
    log('Buildx already initialized');
    return;
  }

  log.info('Configure buildx');

  await docker('info');
  // install emulations
  // https://github.com/docker/setup-qemu-action/blob/9d419fda7df46b2bcd38fadda3ec44f4748d25e1/src/main.ts#L22
  await dockerRun(
    '--privileged',
    'tonistiigi/binfmt',
    '--install',
    SupportedPlatforms
  );
  await dockerBuildx('version');

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
