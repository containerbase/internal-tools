import { exec } from '../../util';
import type { ExecResult } from '../types';

export async function cosign(...args: string[]): Promise<ExecResult> {
  return await exec('cosign', [...args]);
}
