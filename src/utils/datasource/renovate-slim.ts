import {
  ReleaseResult,
  getPkgReleases,
  GetReleasesConfig,
} from 'renovate/dist/datasource';
import { compare, valid } from 'semver';
import log from '../logger';

export const id = 'renovate-slim';

export async function getReleases(
  cfg: GetReleasesConfig
): Promise<ReleaseResult | null> {
  const ret = await getPkgReleases({
    ...cfg,
    depName: 'renovate/renovate',
    lookupName: 'renovate/renovate',
    datasource: 'docker',
    versioning: 'docker',
  });

  if (ret) {
    const releases = ret.releases;
    const versions = new Set<string>();
    ret.releases = [];

    for (const release of releases) {
      const [version, suffix] = release.version.split('-');
      if (
        versions.has(version) ||
        valid(version, { loose: false, includePrerelease: false }) === null ||
        suffix !== 'slim'
      ) {
        log('skiping: ', release.version);
        continue;
      }

      log('use: ', release.version);
      versions.add(version);

      ret.releases.push({ ...release, version });
    }

    ret.releases.sort((a, b) => compare(a.version, b.version));
  }
  return ret;
}
