import type { VersioningApi } from 'renovate/dist/modules/versioning';
import {
  GenericVersion,
  GenericVersioningApi,
} from 'renovate/dist/modules/versioning/generic';
import { api as ubuntu } from 'renovate/dist/modules/versioning/ubuntu';

const versions = new Map<string, GenericVersion>([
  ['bionic', { release: [18, 4] }],
  ['focal', { release: [20, 4] }],
]);

export const id = 'ubuntu';

class CustomUbuntuVersioning extends GenericVersioningApi {
  protected _parse(version: string): GenericVersion | null {
    let res = versions.get(version) ?? null;

    if (!res && ubuntu.isValid(version)) {
      res = { release: version.split('.').map((s) => parseInt(s, 10)) };
    }
    return res;
  }

  protected override _compare(version1: string, version2: string): number {
    const parsed1 = this._parse(version1);
    const parsed2 = this._parse(version2);
    // istanbul ignore if
    if (!parsed1 || !parsed2) {
      return 1;
    }
    const length = Math.max(parsed1.release.length, parsed2.release.length);
    for (let i = 0; i < length; i += 1) {
      const part1 = parsed1.release[i];
      const part2 = parsed2.release[i];
      // shorter is bigger 2.1 > 2.1.1
      // istanbul ignore if
      if (part1 === undefined) {
        return 1;
      }
      // istanbul ignore if
      if (part2 === undefined) {
        return -1;
      }
      if (part1 !== part2) {
        return part1 - part2;
      }
    }
    return 0;
  }

  override isStable(version: string): boolean {
    return versions.has(version) || ubuntu.isStable(version);
  }
}

export const api: VersioningApi = new CustomUbuntuVersioning();

export default api;
