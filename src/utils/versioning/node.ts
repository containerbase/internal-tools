import { VersioningApi } from 'renovate/dist/versioning';
import { api as semver } from 'renovate/dist/versioning/semver';
import { major } from 'semver';

export const id = 'node-lts';

const stableVersions = [12, 14];
export const api: VersioningApi = {
  ...semver,
  isStable: (v) => semver.isStable(v) && stableVersions.includes(major(v)),
};
export default api;
