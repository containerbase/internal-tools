import { getInput } from '@actions/core';
import os from 'os';
import { exec, isDryRun, readJson } from '../../util';
import chalk from 'chalk';
import log from '../../utils/logger';
import { init as cacheInit } from 'renovate/dist/workers/global/cache';
import { getPkgReleases } from 'renovate/dist/datasource';
import { get as getVersioning } from 'renovate/dist/versioning';
import { build, publish } from '../../utils/docker';

export const MultiArgsSplitRe = /\s*(?:[;,]|$)\s*/;

// istanbul ignore if
if (!global.renovateCache) {
  cacheInit(os.tmpdir());
}

global.repoCache = {};
let latestStable: string | undefined;

// async function tagExists(image: string, version: string): Promise<boolean> {
//   const url = `https://index.docker.io/v1/repositories/renovate/${image}/tags/${version}`;
//   try {
//     await got(url);
//     return true;
//   } catch (err) {
//     return false;
//   }
// }

async function getBuildList({
  datasource,
  depName,
  versioning,
  startVersion,
  ignoredVersions,
  lastOnly,
  forceUnstable,
}: Config): Promise<string[]> {
  log('Looking up versions');
  const ver = getVersioning(versioning);
  const pkgResult = await getPkgReleases({
    datasource,
    depName,
    versioning,
  });
  if (!pkgResult) {
    return [];
  }
  let allVersions = pkgResult.releases
    .map((v) => v.version)
    .filter((v) => ver.isVersion(v))
    .map((v) => v.replace(/^v/, ''));
  log(`Found ${allVersions.length} total versions`);
  if (!allVersions.length) {
    return [];
  }
  allVersions = allVersions
    .filter((v) => !ver.isLessThanRange?.(v, startVersion))
    .filter((v) => !ignoredVersions.includes(v));
  log(`Found ${allVersions.length} versions within our range`);
  latestStable =
    pkgResult.latestVersion || allVersions.filter((v) => ver.isStable(v)).pop();
  log('Latest stable version is ' + latestStable);
  const lastVersion = allVersions[allVersions.length - 1];
  log('Most recent version is ' + latestStable);
  if (lastOnly) {
    log('Building last version only');
    allVersions = [lastVersion];
  }
  let buildList: string[] = [];
  if (forceUnstable) {
    log('Force building all versions');
    buildList = allVersions;
  } else {
    log('Force building all stable versions');
    buildList = allVersions.filter((v) => v === lastVersion || ver.isStable(v));
  }

  if (buildList.length) {
    log('Build list: ' + buildList.join(' '));
  } else {
    log('Nothing to build');
  }
  return buildList;
}

async function docker(cmd: string): Promise<void> {
  log('docker ' + cmd);
  await exec('docker', cmd.split(' '));
}

async function buildAndPush(
  { image, buildArg, buildOnly, cache, dryRun }: Config,
  versions: string[]
): Promise<void> {
  const built = [];
  const failed = [];
  for (const tag of versions) {
    const imageVersion = `renovate/${image}:${tag}`;
    log(`Building ${imageVersion}`);
    try {
      await build({
        image,
        tag,
        cache,
        buildArgs: [`${buildArg}=${tag}`],
      });
      if (!buildOnly) {
        await publish({ image, tag, dryRun });
        if (tag === latestStable) {
          await docker(`tag ${imageVersion} renovate/${image}:latest`);
          await publish({ image, tag: 'latest', dryRun });
        }
      }
      log(`Built ${imageVersion}`);
      built.push(tag);
    } catch (err) {
      log.error(err);
      failed.push(tag);
    }
  }
  if (built.length) {
    log('Build list: ' + built.join(' '));
  }
  if (failed.length) {
    log.warn('Failed list: ' + failed.join(' '));
    throw new Error('failed');
  }
}
type ConfigFile = {
  datasource: string;
  depName?: string;
  versioning: string;
  startVersion: string;
  image: string;
  cache?: string;
  buildArg: string;
  ignoredVersions: string[];
  forceUnstable: boolean;
};

type Config = {
  depName: string;
  buildOnly: boolean;
  lastOnly: boolean;
  dryRun: boolean;
} & ConfigFile;

async function generateImages(config: Config): Promise<void> {
  const buildList = await getBuildList(config);
  await buildAndPush(config, buildList);
}

export async function run(): Promise<void> {
  const dryRun = isDryRun();
  const configFile = getInput('config', { required: true });

  const cfg = await readJson<ConfigFile>(configFile);

  const config: Config = {
    ...cfg,
    depName: cfg.depName ?? cfg.image,
    buildArg: cfg.buildArg ?? cfg.image.toUpperCase() + '_VERSION',
    dryRun,
    lastOnly: getInput('last-only') == 'true',
    buildOnly: getInput('build-only') == 'true',
  };
  if (dryRun) {
    log('GitHub Actions branch detected - Force building latest, no push');
    config.lastOnly = true;
  }
  log(config);
  await generateImages(config);

  log.info(chalk.blue('Processing image finished:'));
}
