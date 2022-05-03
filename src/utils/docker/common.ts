import { exec } from '../../util';
import log from '../logger';
import type { ExecResult } from '../types';

export enum DockerPlatform {
  x86_64 = 'linux/amd64',
  aarch64 = 'linux/arm64',
}

export type DockerArch = 'x86_64' | 'aarch64';

export async function docker(...args: string[]): Promise<ExecResult> {
  return await exec('docker', [...args]);
}
export async function dockerRun(...args: string[]): Promise<void> {
  await docker('run', '--rm', ...args);
}

export async function dockerBuildx(...args: string[]): Promise<ExecResult> {
  return await docker('buildx', ...args);
}

type DockerTagConfig = {
  image: string;
  imagePrefix: string;
  src: string;
  tgt: string;
};

export async function dockerTag({
  image,
  imagePrefix,
  src,
  tgt,
}: DockerTagConfig): Promise<ExecResult> {
  return await exec('docker', [
    'tag',
    `${imagePrefix}/${image}:${src}`,
    `${imagePrefix}/${image}:${tgt}`,
  ]);
}

export async function dockerPrune(): Promise<void> {
  log('Pruning docker system');
  await docker('system', 'prune', '--force', '--all');
}

export async function dockerDf(): Promise<void> {
  log('Docker system disk usage');
  await docker('system', 'df');
}
