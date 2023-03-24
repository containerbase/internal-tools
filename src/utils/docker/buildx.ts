import log from '../logger';
import { docker, dockerBuildx, dockerRun } from './common';

const SupportedPlatforms = 'arm64';

export async function init(use?: boolean): Promise<void> {
  const buildx = await dockerBuildx('ls');

  if (buildx.stdout.includes('renovatebot-builder')) {
    log('Buildx already initialized');
    process.env.BUILDX_BUILDER = 'renovatebot-builder';
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
    'docker-container'
  );

  // istanbul ignore if
  if (use) {
    await dockerBuildx('use', 'renovatebot-builder');
  }

  process.env.BUILDX_BUILDER = 'renovatebot-builder';

  await dockerBuildx('inspect', '--bootstrap');
}
