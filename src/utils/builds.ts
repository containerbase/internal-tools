import { isNumber, isString } from '@sindresorhus/is';
import {
  ReleaseResult,
  getPkgReleases,
} from 'renovate/dist/modules/datasource';
import { get as getVersioning } from 'renovate/dist/modules/versioning';
import { add as addHostRule } from 'renovate/dist/util/host-rules';
import { getRegexPredicate } from 'renovate/dist/util/string-match';
import * as semver from 'semver';
import log from './logger';
import * as renovate from './renovate';

renovate.register();

let latestStable: string | undefined;

export { addHostRule };

function getVersions(versions: string[]): ReleaseResult {
  return {
    releases: versions.map((version) => ({
      version,
    })),
  };
}

export interface BuildsConfig {
  allowedVersions?: string;
  datasource: string;
  depName: string;
  forceUnstable?: boolean;
  ignoredVersions: string[];
  maxVersions?: number;
  lastOnly: boolean;
  latestVersion?: string;
  lookupName?: string;
  startVersion: string;
  versioning: string;
  versions?: string[];
  extractVersion?: string;

  registryUrls?: string[];

  /**
   * If `true` process versions from highest to lowest,
   * otherwise process from lowest to highest.
   */
  reverse?: boolean;
}

export interface BuildsResult {
  latestStable: string | undefined;
  versions: string[];
}

export async function getBuildList({
  allowedVersions,
  datasource,
  depName,
  lookupName,
  versioning,
  startVersion,
  ignoredVersions,
  lastOnly,
  forceUnstable,
  versions,
  latestVersion,
  maxVersions,
  extractVersion,
  registryUrls,
  reverse,
}: BuildsConfig): Promise<BuildsResult | null> {
  log('Looking up versions');
  const ver = getVersioning(versioning);
  const pkgResult = versions
    ? getVersions(versions)
    : await getPkgReleases({
        datasource,
        packageName: lookupName ?? depName,
        versioning,
        extractVersion,
        registryUrls,
      });
  if (!pkgResult) {
    return null;
  }
  let allVersions = pkgResult.releases
    .map((v) => v.version.replace(/^v/, ''))
    .filter((v) => ver.isVersion(v) && ver.isCompatible(v, startVersion));

  // filter duplicate versions (16.0.2+7 == 16.0.2+8)
  allVersions = allVersions
    .reverse()
    .filter((v, i) => allVersions.findIndex((f) => ver.equals(f, v)) === i)
    .reverse();

  log(`Found ${allVersions.length} total versions`);
  if (!allVersions.length) {
    return null;
  }
  allVersions = allVersions
    .filter((v) => v === startVersion || ver.isGreaterThan(v, startVersion))
    .filter((v) => !ignoredVersions.includes(v));

  if (!forceUnstable) {
    log('Filter unstable versions');
    allVersions = allVersions.filter((v) => ver.isStable(v));
  }

  if (isString(allowedVersions)) {
    const isAllowedPred = getRegexPredicate(allowedVersions);
    if (isAllowedPred) {
      allVersions = allVersions.filter((version) => isAllowedPred(version));
    } else if (ver.isValid(allowedVersions)) {
      allVersions = allVersions.filter((version) =>
        ver.matches(version, allowedVersions),
      );
    } else if (semver.validRange(allowedVersions)) {
      allVersions = allVersions.filter((v) =>
        semver.satisfies(semver.coerce(v)!, allowedVersions),
      );
    } else {
      log.warn(`Invalid 'allowedVersions' options: ${allowedVersions}`);
      return null;
    }
  }

  if (!allVersions.length) {
    log('Nothing to build');
    return null;
  }

  log(`Found ${allVersions.length} versions within our range`);
  log(`Candidates:`, allVersions.join(', '));

  latestStable =
    latestVersion ??
    /* c8 ignore next 2 */
    /* istanbul ignore next: not testable ts */
    pkgResult.tags?.latest ??
    allVersions.filter((v) => ver.isStable(v)).pop();
  log('Latest stable version is', latestStable);

  if (latestStable && !allVersions.includes(latestStable)) {
    log.warn(
      `LatestStable '${latestStable}' not buildable, candidates:`,
      allVersions.join(', '),
    );
  }

  const lastVersion = allVersions.at(-1)!;
  log('Most recent version is', lastVersion);

  if (isNumber(maxVersions) && maxVersions > 0) {
    log(`Building last ${maxVersions} version only`);
    allVersions = allVersions.slice(-maxVersions);
  }

  if (lastOnly) {
    log('Building last version only');
    allVersions = [latestStable && !forceUnstable ? latestStable : lastVersion];
  }

  if (reverse) {
    allVersions.reverse();
  }

  log('Build list:', allVersions.join(', '));
  return { versions: allVersions, latestStable };
}
