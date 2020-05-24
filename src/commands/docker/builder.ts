import { getInput } from '@actions/core';
import is from '@sindresorhus/is';
import chalk from 'chalk';
import { ReleaseResult, getPkgReleases } from 'renovate/dist/datasource';
import { get as getVersioning } from 'renovate/dist/versioning';
import { getArg, isDryRun, readFile, readJson } from '../../util';
import { build, publish } from '../../utils/docker';
import { init } from '../../utils/docker/buildx';
import { docker, dockerDf } from '../../utils/docker/common';
import log from '../../utils/logger';
import * as renovate from '../../utils/renovate';

renovate.register();

export const MultiArgsSplitRe = /\s*(?:[;,]|$)\s*/;

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
  const ver = getVersioning(versioning as never);
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
    .filter((v) => v === startVersion || ver.isGreaterThan(v, startVersion))
    .filter((v) => !ignoredVersions.includes(v));

  if (!forceUnstable) {
    log('Filter unstable versions');
    allVersions = allVersions.filter((v) => ver.isStable(v));
  }

  log(`Found ${allVersions.length} versions within our range`);
  log(`Candidates:`, allVersions.join(', '));

  latestStable =
    latestVersion ||
    pkgResult.latestVersion ||
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

  if (allVersions.length) {
    log('Build list: ', allVersions.join(', '));
  } else {
    log('Nothing to build');
  }
  return allVersions;
}

function createTag(tagSuffix: string | undefined, version: string): string {
  return is.nonEmptyString(tagSuffix) ? `${version}-${tagSuffix}` : version;
}

async function buildAndPush(
  {
    image,
    buildArg,
    buildArgs,
    buildOnly,
    cache,
    dryRun,
    tagSuffix,
    versioning,
    majorMinor,
  }: Config,
  versions: string[]
): Promise<void> {
  const built: string[] = [];
  const failed: string[] = [];
  const ver = getVersioning(versioning || 'semver');
  const tagsMap = new Map<string, string>();
  for (const version of versions) {
    const tag = createTag(tagSuffix, version);
    const imageVersion = `renovate/${image}:${tag}`;
    log(`Building ${imageVersion}`);
    try {
      const minor = ver.getMinor(version);
      const major = ver.getMajor(version);
      const isStable = ver.isStable(version);
      const cacheTags: string[] = [tagSuffix ?? 'latest'];

      if (isStable && is.number(major) && `${major}` !== version) {
        const nTag = createTag(tagSuffix, `${major}`);
        tagsMap.set(nTag, tag);
        cacheTags.push(nTag);
      }

      if (
        isStable &&
        is.number(major) &&
        is.number(minor) &&
        `${major}.${minor}` !== version
      ) {
        const nTag = createTag(tagSuffix, `${major}.${minor}`);
        tagsMap.set(nTag, tag);
        cacheTags.push(nTag);
      }

      if (version === latestStable) {
        tagsMap.set(tagSuffix ?? 'latest', tag);
      }

      await build({
        image,
        tag,
        cache,
        cacheTags,
        buildArgs: [...(buildArgs ?? []), `${buildArg}=${version}`],
        dryRun,
      });
      if (!buildOnly) {
        await publish({ image, tag, dryRun });
      }
      log(`Built ${imageVersion}`);
      built.push(version);
    } catch (err) {
      log.error(err);
      failed.push(version);
    }

    await dockerDf();
  }

  if (built.length) {
    log('Build list: ' + built.join(' '));
  }

  if (majorMinor) {
    log.info(`Publish <major> and <major>.<minor> tags:`, tagsMap.size);
    for (const [tag, source] of tagsMap) {
      log(`Publish renovate/${image}:${tag}`);
      await docker(`tag renovate/${image}:${source} renovate/${image}:${tag}`);
      if (!buildOnly) {
        await publish({ image, tag, dryRun });
      }
    }
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
  majorMinor: boolean;
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
    if (!is.string(cfg[key]) && is.nonEmptyString(groups[key])) {
      cfg[key] = groups[key] as never;
    }
  }
}

async function readDockerConfig(cfg: ConfigFile): Promise<void> {
  const dockerFileRe = new RegExp(
    '# renovate: datasource=(?<datasource>.*?) depName=(?<depName>.*?)( versioning=(?<versioning>.*?))?\\s' +
      `(?:ENV|ARG) ${cfg.buildArg}=(?<latestVersion>.*)\\s`,
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

  if (!is.object(cfg)) {
    throw new Error('missing-config');
  }

  // TODO: validation
  if (!is.string(cfg.image)) {
    cfg.image = getInput('image', { required: true });
  }

  if (!is.string(cfg.buildArg)) {
    cfg.buildArg = cfg.image.toUpperCase() + '_VERSION';
  }

  await readDockerConfig(cfg);

  const config: Config = {
    ...cfg,
    image: cfg.image,
    depName: cfg.depName ?? cfg.image,
    buildArg: cfg.buildArg,
    buildArgs: getArg('build-args', { multi: true }),
    tagSuffix: getArg('tag-suffix') || undefined,
    ignoredVersions: cfg.ignoredVersions ?? [],
    dryRun,
    lastOnly: getInput('last-only') == 'true',
    buildOnly: getInput('build-only') == 'true',
    majorMinor: getArg('major-minor') !== 'false',
  };

  if (dryRun) {
    log('GitHub Actions branch detected - Force building latest, no push');
    config.lastOnly = true;
  }
  log('config:', JSON.stringify(config));

  await init();

  await generateImages(config);

  log.info(chalk.blue('Processing image finished:'));
}
