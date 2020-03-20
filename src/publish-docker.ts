import { getInput } from '@actions/core';
import { exec } from './util';
import chalk from 'chalk';
import log from 'fancy-log';

// [renovate/base@sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a1]
const digestRe = /([a-f0-9]{64})\]$/;

async function getDigest(image: string): Promise<string> {
  const res = await exec('docker', [
    'inspect',
    "--format='{{.RepoDigests}}'",
    image,
  ]);

  const [, digest] = digestRe.exec(res.stdout) ?? [];

  if (!digest) {
    log.error(res);
    throw new Error('Could not find new digest');
  }

  return digest;
}

export async function run(): Promise<void> {
  const image = getInput('image');

  if (!image) {
    throw new Error('Missing image');
  }

  log.info(chalk.blue('Processing image:'), chalk.yellow(image));

  log('Fetch new digest');
  const newDigest = await getDigest(image);

  log('Backup new image');
  await exec('docker', ['tag', image, 'tmp']);
  log('Fetch old image');
  await exec('docker', ['pull', image]);

  log('Fetch old digest');
  const oldDigest = await getDigest(image);

  if (oldDigest === newDigest) {
    log('Digest uptodate, no push nessessary: ', chalk.yellow(oldDigest));
    return;
  }

  log('Restore new image');
  await exec('docker', ['tag', 'tmp', image]);
  log('Publish new image');
  await exec('docker', ['push', image]);
  log.info(chalk.blue('Processing image finished: ', newDigest));
}
