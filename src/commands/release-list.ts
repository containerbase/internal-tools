import { mkdir, writeFile } from 'node:fs/promises';
import { setFailed } from '@actions/core';
import type { Release } from 'renovate/dist/modules/datasource';
import { getArg, getWorkspace } from '../util';
import { getOctokit, getReleases } from '../utils/github';
import log from '../utils/logger';

export async function run(): Promise<void> {
  try {
    log.info('Release list builder started');
    const ws = getWorkspace();

    await mkdir(`${ws}/_site`, { recursive: true });

    const token = getArg('token', { required: true });
    const api = getOctokit(token);
    const releases = await getReleases(api);
    log('Releases:', releases.map((r) => r.tag_name).join(', '));
    await writeFile(
      `${ws}/_site/releases.json`,
      JSON.stringify({
        releases: releases.map<Release>(({ tag_name, published_at }) => ({
          version: tag_name,
          releaseTimestamp: published_at as Release['releaseTimestamp'],
        })),
      }),
    );
  } catch (err) {
    log.error(err);
    setFailed((err as Error).message);
  }
}
