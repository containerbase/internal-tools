import { exec } from '../../util';
import { ExecResult } from '../types';

export async function cosign(...args: string[]): Promise<ExecResult> {
  process.env['COSIGN_EXPERIMENTAL'] = 'true';
  return await exec('cosign', [...args]);
}
