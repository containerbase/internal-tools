import { getInput, setFailed } from '@actions/core';
import is from '@sindresorhus/is';
import * as chalk from 'chalk';
import { getDefaultVersioning } from 'renovate/dist/modules/datasource';
import { get as getVersioning } from 'renovate/dist/modules/versioning';
import { exec, getArg, isDryRun, readJson } from '../../util';
import { BuildsResult, addHostRule, getBuildList } from '../../utils/builds';
import { readDockerConfig } from '../../utils/config';
import { build, publish } from '../../utils/docker';
import { init } from '../../utils/docker/buildx';
import { dockerDf, dockerPrune, dockerTag } from '../../utils/docker/common';
import log from '../../utils/logger';
import type { Config, ConfigFile } from '../../utils/types';

export const MultiArgsSplitRe = /\s*(?:[;,]|$)\s*/;

function createTag(tagSuffix: string | undefined, version: string): string {
  return is.nonEmptyString(tagSuffix) && tagSuffix !== 'latest'
    ? `${version}-${tagSuffix}`
    : version;
}

async function buildAndPush(
  {
    imagePrefix,
    image,
    buildArg,
    buildArgs,
    buildOnly,
    cache,
    dryRun,
    tagSuffix,
    versioning,
    majorMinor,
    prune,
  }: Config,
  tobuild: BuildsResult
): Promise<void> {
  const builds: string[] = [];
  const failed: string[] = [];
  const ver = getVersioning(versioning);
  const versionsMap = new Map<string, string>();
  if (majorMinor) {
    for (const version of tobuild.versions) {
      const minor = ver.getMinor(version);
      const major = ver.getMajor(version);
      const isStable = ver.isStable(version);

      if (isStable && is.number(major) && `${major}` !== version) {
        versionsMap.set(`${major}`, version);
      }

      if (
        isStable &&
        is.number(major) &&
        is.number(minor) &&
        `${major}.${minor}` !== version
      ) {
        versionsMap.set(`${major}.${minor}`, version);
      }
    }
  }

  await exec('df', ['-h']);

  for (const version of tobuild.versions) {
    const tag = createTag(tagSuffix, version.replace(/\+.+/, ''));
    const imageVersion = `${imagePrefix}/${image}:${tag}`;
    log(`Building ${imageVersion}`);
    try {
      const minor = ver.getMinor(version);
      const major = ver.getMajor(version);
      const cacheTags: string[] = [tagSuffix ?? 'latest'];
      const tags: string[] = [];

      if (
        is.number(major) &&
        majorMinor &&
        versionsMap.get(`${major}`) === version
      ) {
        const nTag = createTag(tagSuffix, `${major}`);
        cacheTags.push(nTag);
        tags.push(nTag);
      }

      if (
        is.number(major) &&
        is.number(minor) &&
        majorMinor &&
        versionsMap.get(`${major}.${minor}`) === version
      ) {
        const nTag = createTag(tagSuffix, `${major}.${minor}`);
        cacheTags.push(nTag);
        tags.push(nTag);
      }

      if (version === tobuild.latestStable) {
        tags.push(tagSuffix ?? 'latest');
      }

      await build({
        image,
        imagePrefix,
        tag,
        cache,
        cacheTags,
        buildArgs: [...(buildArgs ?? []), `${buildArg}=${version}`],
        dryRun,
      });

      if (!buildOnly) {
        await publish({ image, imagePrefix, tag, dryRun });
        const source = tag;

        for (const tag of tags) {
          log(`Publish ${source} as ${tag}`);
          await dockerTag({ image, imagePrefix, src: source, tgt: tag });
          await publish({ image, imagePrefix, tag, dryRun });
        }
      }

      log(`Build ${imageVersion}`);
      builds.push(version);
    } catch (err) {
      log.error(err);
      failed.push(version);
    }

    await dockerDf();
    await exec('df', ['-h']);

    if (prune) {
      await dockerPrune();
      await exec('df', ['-h']);
    }
  }

  if (builds.length) {
    log('Build list:' + builds.join(' '));
  }

  if (failed.length) {
    log.warn('Failed list:' + failed.join(' '));
    throw new Error('failed');
  }
}

async function generateImages(config: Config): Promise<void> {
  const buildList = await getBuildList(config);

  if (!buildList?.versions.length) {
    setFailed(`No versions found.`);
    return;
  }

  await buildAndPush(config, buildList);
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
    imagePrefix: getArg('image-prefix')?.replace(/\/$/, '') || 'renovate',
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
    prune: getArg('prune') === 'true',
    versioning: cfg.versioning ?? getDefaultVersioning(cfg.datasource),
  };

  if (dryRun) {
    log('GitHub Actions branch detected - Force building latest, no push');
    config.lastOnly = true;
  }
  log('config:', JSON.stringify(config));

  const token = getArg('token');

  if (token) {
    addHostRule({ matchHost: 'github.com', token });
  }

  await init();

  await generateImages(config);

  log.info(chalk.blue('Processing done:', config.image));
}
