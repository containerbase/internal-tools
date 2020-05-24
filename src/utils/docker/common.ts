import { ExecResult, exec } from '../../util';
import log from '../logger';

export async function docker(...args: string[]): Promise<ExecResult> {
  return await exec('docker', [...args]);
}
export async function dockerRun(...args: string[]): Promise<void> {
  await docker('run', '--rm', ...args);
}

export async function dockerBuildx(...args: string[]): Promise<void> {
  await docker('buildx', ...args);
}

type DockerTagConfig = {
  image: string;
  src: string;
  tgt: string;
};

export async function dockerTag({
  image,
  src,
  tgt,
}: DockerTagConfig): Promise<ExecResult> {
  return await exec('docker', [
    'tag',
    `renovate/${image}:${src}`,
    `renovate/${image}:${tgt}`,
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
