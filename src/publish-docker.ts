import { getInput } from '@actions/core';
import { exec } from './util';
import chalk from 'chalk';
import log from 'fancy-log';

// sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a1
const shaRe = /sha256:([a-f0-9]{64})/;

async function getImageId(image: string): Promise<string> {
  const res = await exec('docker', ['inspect', "--format='{{.Id}}'", image]);

  const [, id] = shaRe.exec(res.stdout) ?? [];

  if (!id) {
    log.error(res);
    throw new Error('Could not find image id');
  }

  return id;
}

export async function run(): Promise<void> {
  const dryRun = !!getInput('dry-run');
  const image = getInput('image');

  if (!image) {
    throw new Error('Missing image');
  }

  log.info(chalk.blue('Processing image:'), chalk.yellow(image));

  log('Fetch new id');
  const newId = await getImageId(image);

  log('Backup new image');
  await exec('docker', ['tag', image, 'tmp']);
  log('Fetch old image');
  await exec('docker', ['pull', image]);

  log('Fetch old id');
  const oldId = await getImageId(image);

  if (oldId === newId) {
    log('Image uptodate, no push nessessary: ', chalk.yellow(oldId));
    return;
  }

  log('Restore new image');
  await exec('docker', ['tag', 'tmp', image]);
  log('Publish new image');
  if (dryRun) {
    log.warn('DRY-RUN: Would push: ', chalk.yellow(image));
  } else {
    await exec('docker', ['push', image]);
  }
  log.info(chalk.blue('Processing image finished: ', newId));
}
