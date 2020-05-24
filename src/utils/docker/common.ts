import { ExecResult, exec } from '../../util';

export async function docker(...args: string[]): Promise<ExecResult> {
  return await exec('docker', [...args]);
}
export async function dockerRun(...args: string[]): Promise<void> {
  await docker('run', '--rm', ...args);
}

export async function dockerBuildx(...args: string[]): Promise<void> {
  await docker('buildx', ...args);
}
