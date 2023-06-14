import { BuildsConfig, getBuildList } from '../../src/utils/builds';
import { partial } from '../utils';
import { get as getVersioning } from 'renovate/dist/modules/versioning';

jest.mock('renovate/dist/modules/datasource');

const version = '1.22.4';

const config = partial<BuildsConfig>({
  datasource: 'npm',
  versioning: 'npm',
  versions: [version, '2.0.0-rc.24', '2.0.0'],
  startVersion: version,
  ignoredVersions: [],
});

describe('utils/builds', () => {
  it('works', async () => {
    expect(await getBuildList({ ...config })).toEqual({
      versions: [version, '2.0.0'],
      latestStable: '2.0.0',
    });
  });

  it('uses allowedVersions with regex', async () => {
    expect(
      await getBuildList({ ...config, allowedVersions: '/^1\\./' })
    ).toEqual({
      versions: [version],
      latestStable: version,
    });
  });

  it('uses allowedVersions with range', async () => {
    expect(getVersioning(config.versioning).isValid('^16')).toBe(true);
    expect(
      await getBuildList({
        ...config,
        allowedVersions: '^16',
        versions: ['12.0.0', '16.0.1', '16.1.1', '17.0.1'],
      })
    ).toEqual({
      versions: ['16.0.1', '16.1.1'],
      latestStable: '16.1.1',
    });
  });

  it('uses allowedVersions with semver range', async () => {
    expect(
      await getBuildList({
        ...config,
        versioning: 'nuget',
        allowedVersions: '^16',
        versions: ['12.0.0', '16.0.1', '16.1.1', '17.0.1'],
      })
    ).toEqual({
      versions: ['16.0.1', '16.1.1'],
      latestStable: '16.1.1',
    });
  });

  it('return null for wrong allowedVersions', async () => {
    expect(
      await getBuildList({
        ...config,
        versioning: 'node',
        allowedVersions: '^16/',
      })
    ).toBeNull();
  });
});
