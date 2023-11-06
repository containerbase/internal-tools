import { setFailed } from '@actions/core';
import * as chalk from 'chalk';
import * as shell from 'shelljs';
import { getArg, getWorkspace } from '../../util';
import { addHostRule, getBuildList } from '../../utils/builds';
import { init } from '../../utils/docker/buildx';
import {
  downloadAsset,
  getOctokit,
  hasAsset,
  updateRelease,
  uploadAsset,
} from '../../utils/github';
import log from '../../utils/logger';
import { createChecksum } from '../../utils/sum';
import { createBuilderImage, getConfig, runBuilder } from './utils';

let toBuild = 99;

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

    addHostRule({ matchHost: 'github.com', token });

    log('config:', JSON.stringify(cfg));

    const builds = await getBuildList(cfg);

    if (!builds?.versions.length) {
      setFailed(`No versions found.`);
      return;
    }

    shell.mkdir('-p', `${ws}/.cache`);

    await init();

    await createBuilderImage(ws, cfg);

    const failed: string[] = [];

    for (const version of builds.versions) {
      await updateRelease(api, cfg, version);
      if (await hasAsset(api, cfg, version)) {
        if (!(await hasAsset(api, cfg, version, true))) {
          log('Creating checksum for existing version:', version);
          if (!(await downloadAsset(api, cfg, version))) {
            log.warn(chalk.yellow('Missing binary asset:'), version);
            failed.push(version);
            continue;
          }
          try {
            await createChecksum(cfg, version);
            if (cfg.dryRun) {
              log.warn(
                chalk.yellow('[DRY_RUN] Would upload release asset:'),
                version
              );
            } else {
              log('Uploading release:', version);
              await uploadAsset(api, cfg, version, true);
            }
          } catch (e) {
            failed.push(version);
            // eslint-disable-next-line
            log(`Version ${version} failed: ${e.message}`);
          }
          continue;
        } else if (cfg.dryRun) {
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
      if (toBuild-- <= 0) {
        log.info('Build limit reached');
        break;
      }

      log.info('Processing version:', version);

      try {
        log('Runing builder:', version);
        await runBuilder(ws, version);
        await createChecksum(cfg, version);

        if (cfg.dryRun) {
          log.warn(
            chalk.yellow('[DRY_RUN] Would upload release asset:'),
            version
          );
        } else {
          log('Uploading release:', version);
          await uploadAsset(api, cfg, version);
          await uploadAsset(api, cfg, version, true);
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
    log((error as Error).stack);
    setFailed(error as Error);
  }
}
