import 'source-map-support/register';
import { setFailed } from '@actions/core';
import * as chalk from 'chalk';
import { ReleaseResult, getPkgReleases } from 'renovate/dist/datasource';
import { get as getVersioning } from 'renovate/dist/versioning';
import * as shell from 'shelljs';
import { getArg, getWorkspace } from '../../util';
import { init } from '../../utils/docker/buildx';
import {
  getOctokit,
  hasAsset,
  updateRelease,
  uploadAsset,
} from '../../utils/github';
import log from '../../utils/logger';
import { BinaryBuilderConfig } from '../../utils/types';
import { createBuilderImage, getConfig, runBuilder } from './utils';

let builds = 99;

let latestStable: string | undefined;

function getVersions(versions: string[]): ReleaseResult {
  return {
    releases: versions.map((version) => ({
      version,
    })),
  };
}

async function getBuildList({
  datasource,
  depName,
  versioning,
  startVersion,
  ignoredVersions,
  lastOnly,
  forceUnstable,
  versions,
  latestVersion,
}: BinaryBuilderConfig): Promise<string[]> {
  log('Looking up versions');
  const ver = getVersioning(versioning);
  const pkgResult = versions
    ? getVersions(versions)
    : await getPkgReleases({
        datasource,
        depName,
        versioning,
      });
  if (!pkgResult) {
    return [];
  }
  let allVersions = pkgResult.releases
    .map((v) => v.version)
    .filter((v) => ver.isVersion(v) && ver.isCompatible(v, startVersion));
  log(`Found ${allVersions.length} total versions`);
  if (!allVersions.length) {
    return [];
  }
  allVersions = allVersions
    .filter(
      (v) => /* istanbul ignore next */ !ver.isLessThanRange?.(v, startVersion)
    )
    .filter((v) => !ignoredVersions.includes(v));

  if (!forceUnstable) {
    log('Filter unstable versions');
    allVersions = allVersions.filter((v) => ver.isStable(v));
  }

  log(`Found ${allVersions.length} versions within our range`);
  log(`Candidates:`, allVersions.join(', '));

  latestStable =
    latestVersion ||
    /* istanbul ignore next: not testable ts */
    pkgResult.tags?.latest ||
    allVersions.filter((v) => ver.isStable(v)).pop();
  log('Latest stable version is ', latestStable);

  if (latestStable && !allVersions.includes(latestStable)) {
    log.warn(
      `LatestStable '${latestStable}' not buildable, candidates: `,
      allVersions.join(', ')
    );
  }

  const lastVersion = allVersions[allVersions.length - 1];
  log('Most recent version is ', lastVersion);

  if (lastOnly) {
    log('Building last version only');
    allVersions = [latestStable && !forceUnstable ? latestStable : lastVersion];
  }

  // istanbul ignore else
  if (allVersions.length) {
    log('Build list: ', allVersions.join(', '));
  } else {
    log('Nothing to build');
  }
  return allVersions;
}

export async function run(): Promise<void> {
  try {
    log.info('Builder started');
    const ws = getWorkspace();

    const cfg = await getConfig();

    if (cfg.dryRun) {
      log.warn(chalk.yellow('[DRY_RUN] detected'));
      cfg.lastOnly = true;
    }

    const token = getArg('token', { required: true });
    const api = getOctokit(token);

    log('config:', JSON.stringify(cfg));

    const versions = await getBuildList(cfg);

    if (versions.length === 0) {
      setFailed(`No versions found.`);
      return;
    }

    shell.mkdir('-p', `${ws}/.cache`);

    await init();

    await createBuilderImage(ws, cfg);

    const failed: string[] = [];

    for (const version of versions) {
      await updateRelease(api, cfg, version);
      if (await hasAsset(api, cfg, version)) {
        if (cfg.dryRun) {
          log.warn(
            chalk.yellow('[DRY_RUN] Would skipp existing version:'),
            version
          );
        } else {
          log('Skipping existing version:', version);
          continue;
        }
      }

      // istanbul ignore if
      if (builds-- <= 0) {
        log.info('Build limit reached');
        break;
      }

      log.info('Processing version:', version);

      try {
        log('Runing builder:', version);
        await runBuilder(ws, version);

        if (cfg.dryRun) {
          log.warn(
            chalk.yellow('[DRY_RUN] Would upload release asset:'),
            version
          );
        } else {
          log('Uploading release:', version);
          await uploadAsset(api, cfg, version);
        }
      } catch (e) {
        failed.push(version);
        // eslint-disable-next-line
        log(`Version ${version} failed: ${e.message}`, e.stack);
      }
    }

    if (failed.length) {
      setFailed(`Versions failed: ${failed.join(', ')}`);
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    log(error.stack);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    setFailed(error.message);
  }
}
