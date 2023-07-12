import { BinaryLike, createHash } from 'node:crypto';
import { readBuffer, writeFile } from '../util';
import { getBinaryName } from './config';
import { BinaryBuilderConfig, sumType } from './types';

export function hash(file: BinaryLike): string {
  return createHash(sumType).update(file).digest('hex');
}

export async function createChecksum(
  cfg: BinaryBuilderConfig,
  version: string
): Promise<void> {
  const name = getBinaryName(cfg, version);
  const sumName = getBinaryName(cfg, version, true);
  const buffer = await readBuffer(`.cache/${name}`);

  const sum = hash(buffer);

  await writeFile(`.cache/${sumName}`, sum);
}
