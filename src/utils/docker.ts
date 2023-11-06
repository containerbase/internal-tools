import { setTimeout } from 'node:timers/promises';
import is from '@sindresorhus/is';
import chalk from 'chalk';
import { dockerBuildx } from './docker/common';
import log from './logger';
import { ExecError } from './types';

export type BuildOptions = {
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
};

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
}: BuildOptions): Promise<void> {
  const args = ['build'];

  if (is.nonEmptyArray(buildArgs)) {
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

  if (is.string(cache)) {
    const cachePrefix = cache.split('/')[0]?.match(/[.:]/)
      ? ''
      : `${imagePrefix}/`;
    const cacheImage = `${cachePrefix}${cache}:${image.replace(/\//g, '-')}`;
    args.push(`--cache-from=${cacheImage}-${tag}`);

    if (is.nonEmptyArray(cacheFromTags)) {
      for (const ctag of cacheFromTags) {
        args.push(`--cache-from=${cacheImage}-${ctag}`);
      }
    }

    if (!dryRun && push) {
      args.push(
        `--cache-to=type=registry,ref=${cacheImage}-${tag},mode=max,ignore-error=true`
      );
      if (is.nonEmptyArray(cacheToTags)) {
        for (const ctag of cacheToTags) {
          args.push(
            `--cache-to=type=registry,ref=${cacheImage}-${ctag},mode=max,ignore-error=true`
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
}
