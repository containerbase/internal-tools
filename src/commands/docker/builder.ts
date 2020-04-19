import { getInput } from '@actions/core';
import os from 'os';
import { exec, isDryRun, readJson, readFile, getArg } from '../../util';
import chalk from 'chalk';
import log from '../../utils/logger';
import { init as cacheInit } from 'renovate/dist/workers/global/cache';
import { getPkgReleases, ReleaseResult } from 'renovate/dist/datasource';
import { get as getVersioning } from 'renovate/dist/versioning';
import { build, publish } from '../../utils/docker';

export const MultiArgsSplitRe = /\s*(?:[;,]|$)\s*/;

// istanbul ignore if
if (!global.renovateCache) {
  cacheInit(os.tmpdir());
}

global.repoCache = {};
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
}: Config): Promise<string[]> {
  log('Looking up versions');
  const ver = getVersioning(versioning || 'semver');
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
  log(`Found ${allVersions.length} versions within our range`);
  latestStable =
    latestVersion ||
    pkgResult.latestVersion ||
    allVersions.filter((v) => ver.isStable(v)).pop();
  log('Latest stable version is ', latestStable);
  const lastVersion = allVersions[allVersions.length - 1];
  log('Most recent version is ', latestStable);
  if (lastOnly) {
    log('Building last version only');
    allVersions = [latestStable && !forceUnstable ? latestStable : lastVersion];
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
  { image, buildArg, buildArgs, buildOnly, cache, dryRun, tagSuffix }: Config,
  versions: string[]
): Promise<void> {
  const built = [];
  const failed = [];
  for (const version of versions) {
    let tag = [version, tagSuffix].filter(Boolean).join('-');
    const imageVersion = `renovate/${image}:${tag}`;
    log(`Building ${imageVersion}`);
    try {
      await build({
        image,
        tag,
        cache,
        buildArg,
        buildArgs,
        dryRun,
      });
      if (!buildOnly) {
        await publish({ image, tag, dryRun });
        if (version === latestStable) {
          tag = tagSuffix ?? 'latest';
          await docker(`tag ${imageVersion} renovate/${image}:${tag}`);
          await publish({ image, tag, dryRun });
        }
      }
      log(`Built ${imageVersion}`);
      built.push(version);
    } catch (err) {
      log.error(err);
      failed.push(version);
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
  image: string;
  depName?: string;
  versioning?: string;
  startVersion: string;
  cache?: string;
  buildArg?: string;
  ignoredVersions?: string[];
  forceUnstable?: boolean;
  versions?: string[];
  latestVersion?: string;
};

type Config = {
  buildArg: string;
  buildArgs?: string[];
  buildOnly: boolean;
  tagSuffix?: string;
  depName: string;
  image: string;
  ignoredVersions: string[];
  lastOnly: boolean;
  dryRun: boolean;
} & ConfigFile;

async function generateImages(config: Config): Promise<void> {
  const buildList = await getBuildList(config);
  await buildAndPush(config, buildList);
}

const keys: (keyof ConfigFile)[] = [
  'datasource',
  'depName',
  'buildArg',
  'versioning',
  'latestVersion',
];

function checkArgs(
  cfg: ConfigFile,
  groups: Record<string, string | undefined>
): void {
  for (const key of keys) {
    if (!cfg[key] && groups[key]) {
      cfg[key] = groups[key] as never;
    }
  }
}

async function readDockerConfig(cfg: ConfigFile): Promise<void> {
  const buildArg = cfg.buildArg ?? '(?<buildArg>.*?_VERSION)';
  const dockerFileRe = new RegExp(
    '# renovate: datasource=(?<datasource>.*?) depName=(?<depName>.*?)( versioning=(?<versioning>.*?))?\\s' +
      `(?:ENV|ARG) ${buildArg}=(?<latestVersion>.*)\\s`,
    'g'
  );
  const dockerfile = await readFile('Dockerfile');
  const m = dockerFileRe.exec(dockerfile);
  if (m && m.groups) {
    checkArgs(cfg, m.groups);
  }
}

export async function run(): Promise<void> {
  const dryRun = isDryRun();
  const configFile = getInput('config') || 'builder.json';

  const cfg = await readJson<ConfigFile>(configFile);

  if (!cfg) {
    throw new Error('missing-config');
  }

  await readDockerConfig(cfg);

  // TODO: validation
  if (!cfg.image) {
    cfg.image = getInput('image', { required: true });
  }

  const config: Config = {
    ...cfg,
    image: cfg.image,
    depName: cfg.depName ?? cfg.image,
    buildArg: cfg.buildArg ?? cfg.image.toUpperCase() + '_VERSION',
    buildArgs: getArg('build-args', { multi: true }),
    tagSuffix: getArg('tag-suffix') || undefined,
    ignoredVersions: cfg.ignoredVersions ?? [],
    dryRun,
    lastOnly: getInput('last-only') == 'true',
    buildOnly: getInput('build-only') == 'true',
  };

  if (dryRun) {
    log('GitHub Actions branch detected - Force building latest, no push');
    config.lastOnly = true;
  }
  log('config:', JSON.stringify(config));
  await generateImages(config);

  log.info(chalk.blue('Processing image finished:'));
}
