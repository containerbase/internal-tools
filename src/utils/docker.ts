import fs from 'node:fs/promises';
import os from 'node:os';
import { setTimeout } from 'node:timers/promises';
import { isNonEmptyArray, isString } from '@sindresorhus/is';
import chalk from 'chalk';
import { dockerBuildx } from './docker/common';
import log from './logger';
import { DockerBuildxMetaData, ExecError } from './types';

export interface BuildOptions {
  image: string;
  imagePrefix: string;
  imagePrefixes?: string[];
  cache?: string;
  cacheFromTags?: string[];
  cacheToTags?: string[];
  tag?: string;
  tags?: string[];
  dryRun?: boolean;
  buildArgs?: string[];
  platforms?: string[];
  push?: boolean;
}

const errors = [
  'unexpected status: 400 Bad Request',
  ': no response',
  'error writing layer blob',
];

function canRetry(err: ExecError): boolean {
  return errors.some((str) => err.stderr.includes(str));
}

export async function build({
  image,
  imagePrefix,
  imagePrefixes,
  cache,
  cacheFromTags,
  cacheToTags,
  tag = 'latest',
  tags,
  dryRun,
  buildArgs,
  platforms,
  push,
}: BuildOptions): Promise<DockerBuildxMetaData> {
  const args = ['build'];

  if (isNonEmptyArray(buildArgs)) {
    args.push(...buildArgs.map((b) => `--build-arg=${b}`));
  }

  if (platforms?.length) {
    args.push(`--platform=${platforms.join(',')}`);
  }

  for (const prefix of [imagePrefix, ...(imagePrefixes ?? [])]) {
    args.push(`--tag=${prefix}/${image}:${tag}`);
    if (tags?.length) {
      args.push(...tags.map((tag) => `--tag=${prefix}/${image}:${tag}`));
    }
  }

  if (isString(cache)) {
    const cachePrefix = cache.split('/')[0]?.match(/[.:]/)
      ? ''
      : `${imagePrefix}/`;
    const cacheImage = `${cachePrefix}${cache}:${image.replace(/\//g, '-')}`;
    args.push(`--cache-from=${cacheImage}-${tag}`);

    if (isNonEmptyArray(cacheFromTags)) {
      for (const ctag of cacheFromTags) {
        args.push(`--cache-from=${cacheImage}-${ctag}`);
      }
    }

    if (!dryRun && push) {
      args.push(
        `--cache-to=type=registry,ref=${cacheImage}-${tag},mode=max,ignore-error=true`,
      );
      if (isNonEmptyArray(cacheToTags)) {
        for (const ctag of cacheToTags) {
          args.push(
            `--cache-to=type=registry,ref=${cacheImage}-${ctag},mode=max,ignore-error=true`,
          );
        }
      }
    }
  }

  if (dryRun) {
    log.warn(chalk.yellow('[DRY_RUN]'), chalk.blue('Would push'));
  } else if (push) {
    args.push('--push', '--provenance=false');
  }

  const tmpDir = await fs.mkdtemp(
    `${os.tmpdir()}/internal-tools-docker-build-`,
  );
  const metadataFile = `${tmpDir}/metadata.json`;
  args.push('--metadata-file', metadataFile);
  try {
    for (let build = 0; ; build++) {
      try {
        await dockerBuildx(...args, '.');
        break;
      } catch (e) {
        if (e instanceof ExecError && canRetry(e) && build < 2) {
          log.error(chalk.red(`docker build error on try ${build}`), e);
          await setTimeout(5000);
          continue;
        }
        throw e;
      }
    }

    return JSON.parse(
      await fs.readFile(metadataFile, 'utf8'),
    ) as DockerBuildxMetaData;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
