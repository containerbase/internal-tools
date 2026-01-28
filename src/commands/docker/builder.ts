import { styleText } from 'node:util';
import { getInput, setFailed } from '@actions/core';
import {
  isNonEmptyString,
  isNumber,
  isObject,
  isString,
} from '@sindresorhus/is';
import { getDefaultVersioning } from 'renovate/dist/modules/datasource/common';
import { get as getVersioning } from 'renovate/dist/modules/versioning';
import { exec, exists, getArg, isDryRun, readJson } from '../../util';
import { BuildsResult, addHostRule, getBuildList } from '../../utils/builds';
import { readDockerConfig } from '../../utils/config';
import { build } from '../../utils/docker';
import { init } from '../../utils/docker/buildx';
import { dockerDf, dockerPrune } from '../../utils/docker/common';
import { cosign } from '../../utils/docker/cosign';
import log from '../../utils/logger';
import type { ConfigFile, DockerBuilderConfig } from '../../utils/types';

function createTag(tagSuffix: string | undefined, version: string): string {
  return isNonEmptyString(tagSuffix) && tagSuffix !== 'latest'
    ? `${version}-${tagSuffix}`
    : version;
}

async function buildAndPush(
  {
    imagePrefix,
    imagePrefixes,
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
    platforms,
    skipLatestTag,
  }: DockerBuilderConfig,
  tobuild: BuildsResult,
): Promise<void> {
  const builds: string[] = [];
  const failed: string[] = [];
  const ver = getVersioning(versioning);
  const versionsMap = new Map<string, string>();

  const dfExists = await exists('df');

  if (majorMinor) {
    for (const version of tobuild.versions) {
      const minor = ver.getMinor(version);
      const major = ver.getMajor(version);
      const isStable = ver.isStable(version);

      if (isStable && isNumber(major) && `${major}` !== version) {
        versionsMap.set(`${major}`, version);
      }

      if (
        isStable &&
        isNumber(major) &&
        isNumber(minor) &&
        `${major}.${minor}` !== version
      ) {
        versionsMap.set(`${major}.${minor}`, version);
      }
    }
  }

  /* c8 ignore start */
  // istanbul ignore if: only linux
  if (dfExists) {
    await exec('df', ['-h']);
  }
  /* c8 ignore stop */

  let shouldSign = false;

  if (!dryRun && !buildOnly) {
    shouldSign = await exists('cosign');
    if (!shouldSign) {
      log.warn('Cosign is not installed. Skipping container signing');
    }
  }

  for (const version of tobuild.versions) {
    const tag = createTag(tagSuffix, version.replace(/\+.+/, ''));
    const imageVersion = `${imagePrefix}/${image}:${tag}`;
    log(`Building ${imageVersion}`);
    try {
      const minor = ver.getMinor(version);
      const major = ver.getMajor(version);
      const cacheFromTags: string[] = [tagSuffix ?? 'latest'];
      const cacheToTags: string[] = [];
      const tags: string[] = [];

      if (isNumber(major)) {
        const nTag = createTag(tagSuffix, `${major}`);
        cacheFromTags.push(nTag);
        if (versionsMap.get(`${major}`) === version) {
          cacheToTags.push(nTag);
          if (majorMinor) {
            tags.push(nTag);
          }
        }
      }
      if (isNumber(major) && isNumber(minor)) {
        const nTag = createTag(tagSuffix, `${major}.${minor}`);
        cacheFromTags.push(nTag);
        if (versionsMap.get(`${major}.${minor}`) === version) {
          cacheToTags.push(nTag);
          if (majorMinor) {
            tags.push(nTag);
          }
        }
      }

      if (version === tobuild.latestStable && skipLatestTag !== true) {
        cacheToTags.push(tagSuffix ?? 'latest');
        tags.push(tagSuffix ?? 'latest');
      }

      const meta = await build({
        image,
        imagePrefix,
        imagePrefixes,
        tag,
        tags,
        cache,
        cacheFromTags,
        cacheToTags,
        buildArgs: [...(buildArgs ?? []), `${buildArg}=${version}`],
        dryRun,
        platforms,
        push: !buildOnly,
      });

      if (!buildOnly && shouldSign) {
        for (const prefix of [imagePrefix, ...imagePrefixes]) {
          log(
            'Signing image',
            `${prefix}/${image}@${meta['containerimage.digest']}`,
          );
          await cosign(
            'sign',
            '--yes',
            `${prefix}/${image}@${meta['containerimage.digest']}`,
          );
        }
      }

      log(`Build ${imageVersion}`);
      builds.push(version);
    } catch (err) {
      log.error(err);
      failed.push(version);
    }

    await dockerDf();
    /* c8 ignore start */
    // istanbul ignore if: only linux
    if (dfExists) {
      await exec('df', ['-h']);
    }
    /* c8 ignore stop */

    if (prune) {
      await dockerPrune();
      /* c8 ignore start */
      // istanbul ignore if: only linux
      if (dfExists) {
        await exec('df', ['-h']);
      }
      /* c8 ignore stop */
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

async function generateImages(config: DockerBuilderConfig): Promise<void> {
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

  if (!isObject(cfg)) {
    throw new Error('missing-config');
  }

  // TODO: validation
  if (!isString(cfg.image)) {
    cfg.image = getInput('image', { required: true });
  }

  if (!isString(cfg.buildArg)) {
    cfg.buildArg = cfg.image.toUpperCase() + '_VERSION';
  }

  await readDockerConfig(cfg);

  const config: DockerBuilderConfig = {
    ...cfg,
    imagePrefix: getArg('image-prefix')?.replace(/\/$/, '') || 'renovate',
    imagePrefixes: getArg('image-prefixes', { multi: true })?.map((ip) =>
      ip.replace(/\/$/, ''),
    ),
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
    platforms: getArg('platforms', { multi: true }),
    skipLatestTag: cfg.skipLatestTag ?? getArg('skip-latest-tag') === 'true',
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

  log.info(styleText('blue', `Processing done: ${config.image}`));
}
