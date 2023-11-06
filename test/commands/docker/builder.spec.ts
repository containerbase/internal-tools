/* eslint-disable @typescript-eslint/no-var-requires */
import * as _core from '@actions/core';
import * as _datasources from 'renovate/dist/modules/datasource';
import { run } from '../../../src/commands/docker/builder';
import * as _utils from '../../../src/util';
import * as _docker from '../../../src/utils/docker';
import { mocked } from '../../utils';

jest.mock('renovate/dist/modules/datasource');
jest.mock('../../../src/util');
jest.mock('../../../src/utils/docker');
jest.mock('../../../src/utils/docker/cosign');
jest.mock('../../../src/utils/docker/buildx', () => ({
  init: () => Promise.resolve(),
}));
jest.mock('../../../src/utils/datasource');

const core = mocked(_core);
const utils = mocked(_utils);
const docker = mocked(_docker);
const datasources = mocked(_datasources);
const version = '1.22.4';

describe('commands/docker/builder', () => {
  let args: Record<string, string | string[]> = {};

  beforeEach(() => {
    jest.resetAllMocks();
    core.getInput.mockReturnValueOnce('builder.json');
    core.getInput.mockReturnValueOnce('yarn');
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/yarn.json'));
    args = {};
    utils.getArg.mockImplementation((n, o) => args[n] ?? (o?.multi ? [] : ''));
  });

  it('works yarn', async () => {
    args.token = 'ghp_xxx'; // coverage only
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=npm depName=yarn versioning=npm\nARG YARN_VERSION=${version}\n`
    );
    utils.exists.mockResolvedValue(true);
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '2.0.0-rc.24' }],
    });

    await run();

    expect(docker.build.mock.calls).toMatchSnapshot('build');
  });

  it('works pnpm', async () => {
    utils.readJson.mockReset();
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/pnpm.json'));
    args = {
      ...args,
      'image-prefix': 'ghcr.io/renovatebot/',
      'image-prefixes': ['ghcr.io/renovatebot/'],
      'build-args': ['IMAGE=slim'],
      'tag-suffix': 'slim',
    };
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version: '4.0.0-rc.24' }, { version: '5.0.0' }],
    });

    await run();

    expect(docker.build.mock.calls).toMatchSnapshot('build');
  });

  it('works gradle', async () => {
    utils.readJson.mockReset();
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/gradle.json'));
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [
        { version: '0.7' },
        { version: '2.3' },
        { version: '3.0' },
        { version: '3.5.4' },
        { version: '3.5.5' },
        { version: '4.5' },
        { version: '6.0' },
      ],
    });

    await run();

    expect(docker.build.mock.calls).toHaveLength(3);
    expect(docker.build.mock.calls.map(([args]) => args.tag)).toEqual([
      '3.5.5',
      '4.5',
      '6.0',
    ]);
    expect(docker.build.mock.calls).toMatchSnapshot('build');
  });

  it('works java', async () => {
    utils.readJson.mockReset();
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/java.json'));
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [
        { version: '8.0.302+8' },
        { version: '11.0.12+7' },
        { version: '16.0.2+7' },
        { version: '16.0.2+9' },
      ],
    });

    await run();

    expect(docker.build.mock.calls).toHaveLength(3);
    expect(docker.build.mock.calls.map(([args]) => args.tag)).toEqual([
      '8.0.302',
      '11.0.12',
      '16.0.2',
    ]);
    expect(docker.build.mock.calls).toMatchSnapshot('build');
  });

  it('works helm', async () => {
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=github-releases depName=helm lookupName=helm/helm\nARG HELM_VERSION=3.4.0\n`
    );
    utils.readJson.mockReset();
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/helm.json'));
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [
        { version: '2.0.0' },
        { version: '3.4.0' },
        { version: '3.7.0-rc.3' },
        { version: '3.7.0' },
        { version: '3.7.1' },
      ],
    });

    await run();

    expect(datasources.getPkgReleases.mock.calls).toMatchObject([
      [
        {
          packageName: 'helm/helm',
          datasource: 'github-releases',
        },
      ],
    ]);

    expect(docker.build.mock.calls).toHaveLength(3);
    expect(docker.build.mock.calls.map(([args]) => args.tag)).toEqual([
      '3.4.0',
      '3.7.0',
      '3.7.1',
    ]);
    expect(docker.build.mock.calls).toMatchSnapshot('build');
  });

  it('works swift', async () => {
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=docker depName=swift versioning=loose\nARG SWIFT_VERSION=5.5.2\n`
    );
    utils.readJson.mockReset();
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/swift.json'));
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [
        { version: '4.0' },
        { version: '4.0.1' },
        { version: '5.3' },
        { version: '5.3.1' },
        { version: '5.4' },
        { version: '5.4.2' },
      ],
    });

    await run();

    expect(datasources.getPkgReleases.mock.calls).toMatchObject([
      [
        {
          packageName: 'swift',
          datasource: 'docker',
        },
      ],
    ]);

    expect(docker.build.mock.calls).toHaveLength(4);
    expect(docker.build.mock.calls.map(([args]) => args.tag)).toEqual([
      '5.3',
      '5.3.1',
      '5.4',
      '5.4.2',
    ]);
    expect(docker.build.mock.calls).toMatchSnapshot('build');
  });

  it('works dummy', async () => {
    jest.resetAllMocks();
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/dummy.json'));

    await run();

    expect(docker.build.mock.calls).toMatchSnapshot('build');
  });

  it('works ubuntu', async () => {
    jest.resetAllMocks();
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/ubuntu.json'));

    await run();

    expect(docker.build.mock.calls).toMatchSnapshot('build');
  });

  it('last-only dummy', async () => {
    utils.readJson.mockReset();
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/dummy.json'));
    core.getInput.mockReset();
    core.getInput.mockReturnValueOnce('builder.json');
    core.getInput.mockReturnValueOnce('true');

    args = {
      ...args,
      'build-args': ['IMAGE=slim'],
      'tag-suffix': 'slim',
      'major-minor': 'false',
      prune: 'true',
    };

    await run();

    expect(docker.build.mock.calls).toMatchSnapshot('build');
  });

  it('build-only yarn', async () => {
    core.getInput.mockReturnValueOnce('true');
    core.getInput.mockReturnValueOnce('true');
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '2.0.0-rc.24' }],
    });

    await run();

    expect(docker.build.mock.calls).toMatchSnapshot('build');
  });

  it('updates image yarn (dry-run)', async () => {
    utils.isDryRun.mockReturnValueOnce(true);
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version: '1.5.0' }, { version }],
    });

    await run();

    expect(docker.build.mock.calls).toMatchSnapshot('build');
  });

  it('no releases', async () => {
    datasources.getPkgReleases.mockResolvedValueOnce(null);
    await run();

    expect(docker.build).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('No versions found.');
  });

  it('empty releases', async () => {
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [],
    });

    await run();

    expect(docker.build).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('No versions found.');
  });

  it('unstable releases', async () => {
    utils.readJson.mockReset();
    utils.readJson.mockResolvedValueOnce({
      ...require('./__fixtures__/pnpm.json'),
      ignoredVersions: ['3.5.4'],
    });
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version: '3.5.4' }],
    });

    await run();
    expect(docker.build.mock.calls).toEqual([]);
  });

  it('catch error', async () => {
    expect.assertions(1);
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }],
    });

    docker.build.mockRejectedValueOnce(new Error('failure'));
    await expect(run()).rejects.toThrow('failed');
  });

  it('throws missing-image', async () => {
    expect.assertions(1);
    jest.resetAllMocks();
    utils.readJson.mockResolvedValueOnce({});
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockImplementationOnce(() => {
      throw new Error('missing-image');
    });
    await expect(run()).rejects.toThrow('missing-image');
  });

  it('throws missing-config', async () => {
    expect.assertions(1);
    jest.resetAllMocks();
    utils.readJson.mockResolvedValueOnce(undefined);

    await expect(run()).rejects.toThrow('missing-config');
  });
});
