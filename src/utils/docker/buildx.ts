import log from '../logger';
import { docker, dockerBuildx } from './common';

export async function init(): Promise<void> {
  const buildx = await dockerBuildx('ls');

  if (buildx.stdout.includes('renovatebot-builder')) {
    log('Buildx already initialized');
    return;
  }

  log.info('Configure buildx');

  await docker('info');
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
