import { getInput } from '@actions/core';
import { exec } from './util';
import chalk from 'chalk';
import log from 'fancy-log';
import { getRemoteImageId, getLocalImageId } from './utils/docker';

export const MultiArgsSplitRe = /\s*(?:;|$)\s*/;
export async function run(): Promise<void> {
  const dryRun = !!getInput('dry-run');
  const image = getInput('image');
  let tags = getInput('tags')
    ?.split(MultiArgsSplitRe)
    .filter(Boolean);

  if (!tags?.length) {
    tags = ['latest'];
  }

  if (!image) {
    throw new Error('Missing image');
  }

  for (const tag of tags) {
    const fullName = `${image}:${tag}`;
    log.info(chalk.blue('Processing image:'), chalk.yellow(fullName));

    log('Fetch new id');
    const newId = await getLocalImageId(image, tag);

    log('Fetch old id');
    const oldId = await getRemoteImageId(image, tag);

    if (oldId === newId) {
      log('Image uptodate, no push nessessary: ', chalk.yellow(oldId));
      continue;
    }

    log('Publish new image', `${oldId} > ${newId}`);
    if (dryRun) {
      log.warn(chalk.yellow('DRY-RUN: Would push: '), fullName);
    } else {
      await exec('docker', ['push', fullName]);
    }
    log.info(chalk.blue('Processing image finished: ', newId));
  }
}
