import { group } from '@actions/core';
import { exec, resolveFile } from '../../util';

async function docker(...args: string[]): Promise<void> {
  await exec('docker', [...args]);
}
async function dockerRun(...args: string[]): Promise<void> {
  await docker('run', '--rm', ...args);
}

async function dockerBuildx(...args: string[]): Promise<void> {
  await docker('buildx', ...args);
}

export async function run(): Promise<void> {
  const file = await resolveFile('bin/configure-docker.sh');
  await exec(file, []);

  await group('docker-info', async () => {
    await docker('info');
    await dockerBuildx('version');
  });

  await group('quemu-multiarch-install', async () => {
    await dockerRun(
      '--privileged',
      'multiarch/qemu-user-static',
      '--reset',
      '-p',
      'yes'
    );
  });

  await group('buildx-builder-create', async () => {
    await dockerBuildx(
      'create',
      '--name',
      'renovatebot-builder',
      '--driver',
      ' docker-container',
      '--use'
    );
  });

  await group('buildx-builder-bootstrap', async () => {
    await dockerBuildx('inspect', '--bootstrap');
  });
}
