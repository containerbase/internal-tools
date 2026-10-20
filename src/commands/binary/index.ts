import { mkdir } from 'node:fs/promises';
import { styleText } from 'node:util';
import { setFailed } from '@actions/core';
import { getArg, getWorkspace } from '../../util';
import { type BuildsResult, addHostRule, getBuildList } from '../../utils/builds';
import { init } from '../../utils/docker/buildx';
import {
  type GitHubOctokit,
  downloadAsset,
  getOctokit,
  hasAsset,
  hasVersionAsset,
  updateRelease,
  uploadAsset,
  uploadVersionAsset,
} from '../../utils/github';
import log from '../../utils/logger';
import { createChecksum } from '../../utils/sum';
import type { BinaryBuilderConfig } from '../../utils/types';
import { createBuilderImage, getConfig, runBuilder, runTest } from './utils';

/**
 * Builds, tests and uploads the missing versions, at most `build-limit` per run.
 */
export async function run(): Promise<void> {
  try {
    log.info('Builder started');
    const ws = getWorkspace();

    const cfg = await getConfig();

    if (cfg.dryRun) {
      log.warn(styleText('yellow', '[DRY_RUN] detected'));
      cfg.lastOnly = true;
    }

    const token = getArg('token', { required: true });
    const api = getOctokit(token);

    addHostRule({ matchHost: 'github.com', token });

    log('config:', JSON.stringify(cfg));

    const builds = await getBuildList(cfg);

    if (!builds?.versions.length) {
      setFailed(`No versions found.`);
      return;
    }

    await mkdir(`${ws}/.cache`, { recursive: true });

    await init();

    await createBuilderImage(ws, cfg);

    const failed: string[] = [];
    let toBuild = cfg.buildLimit;

    for (const version of builds.versions) {
      if (cfg.dryRun) {
        log.warn(styleText('yellow', '[DRY_RUN] Would update release:'), version);
      } else {
        log('Updating release:', version);
        await updateRelease(api, cfg, version, builds.latestStable);
      }

      if (await hasAsset(api, cfg, version)) {
        if (!(await hasAsset(api, cfg, version, true))) {
          log('Creating checksum for existing version:', version);
          if (!(await downloadAsset(api, cfg, version))) {
            log.warn(styleText('yellow', 'Missing binary asset:'), version);
            failed.push(version);
            continue;
          }
          try {
            await createChecksum(cfg, version);
            if (cfg.dryRun) {
              log.warn(styleText('yellow', '[DRY_RUN] Would upload release asset:'), version);
            } else {
              log('Uploading release:', version);
              await uploadAsset(api, cfg, version, builds.latestStable, true);
            }

            await uploadVersionAssetIfNeeded(api, version, cfg, builds);
          } catch (e) {
            failed.push(version);
            log(`Version ${version} failed: ${e.message}`);
          }
          continue;
        } else if (cfg.dryRun) {
          log.warn(styleText('yellow', '[DRY_RUN] Would skipp existing version:'), version);
        } else {
          log('Skipping existing version:', version);
          continue;
        }
      }

      if (toBuild-- <= 0) {
        log.info('Build limit reached:', cfg.buildLimit);
        break;
      }

      log.info('Processing version:', version);

      try {
        log('Runing builder:', version);
        await runBuilder(ws, version);
        await runTest(ws, cfg, version);
        await createChecksum(cfg, version);

        if (cfg.dryRun) {
          log.warn(styleText('yellow', '[DRY_RUN] Would upload release asset:'), version);
        } else {
          log('Uploading release:', version);
          await uploadAsset(api, cfg, version, builds.latestStable);
          await uploadAsset(api, cfg, version, builds.latestStable, true);
        }

        await uploadVersionAssetIfNeeded(api, version, cfg, builds);
      } catch (e) {
        failed.push(version);
        log(`Version ${version} failed: ${e.message}`, e.stack);
      }
    }

    if (failed.length) {
      setFailed(`Versions failed: ${failed.join(', ')}`);
    }
  } catch (error) {
    log((error as Error).stack);
    setFailed(error as Error);
  }
}

async function uploadVersionAssetIfNeeded(
  api: GitHubOctokit,
  version: string,
  cfg: BinaryBuilderConfig,
  builds: BuildsResult,
): Promise<void> {
  if (!(await hasVersionAsset(api, version))) {
    // v8 ignore next -- TODO: add test
    const latestStable = builds.latestStable ?? version;
    if (cfg.dryRun) {
      log.warn(styleText('yellow', '[DRY_RUN] Would upload version asset:'), latestStable);
    } else {
      log('Uploading version file:', latestStable);
      await uploadVersionAsset(api, cfg, version, builds.latestStable);
    }
  }
}
