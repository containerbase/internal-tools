import { getInput } from '@actions/core';
import { exec } from './util';
import chalk from 'chalk';
import log from 'fancy-log';
import { getRemoteImageId, getLocalImageId } from './utils/docker';

export async function run(): Promise<void> {
  const dryRun = !!getInput('dry-run');
  const image = getInput('image');

  if (!image) {
    throw new Error('Missing image');
  }

  log.info(chalk.blue('Processing image:'), chalk.yellow(image));

  log('Fetch new id');
  const newId = await getLocalImageId(image);

  log('Fetch old id');
  const oldId = await getRemoteImageId(image);

  if (oldId === newId) {
    log('Image uptodate, no push nessessary: ', chalk.yellow(oldId));
    return;
  }

  log('Publish new image');
  if (dryRun) {
    log.warn('DRY-RUN: Would push: ', chalk.yellow(image));
  } else {
    await exec('docker', ['push', image]);
  }
  log.info(chalk.blue('Processing image finished: ', newId));
}
