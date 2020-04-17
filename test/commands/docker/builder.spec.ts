/* eslint-disable @typescript-eslint/no-var-requires */
import * as _core from '@actions/core';
import { getName, mocked } from '../../utils';
import * as _docker from '../../../src/utils/docker';
import * as _utils from '../../../src/util';
import { run } from '../../../src/commands/docker/builder';
import * as _datasources from 'renovate/dist/datasource';

jest.mock('renovate/dist/workers/global/cache');
jest.mock('renovate/dist/datasource');
jest.mock('../../../src/util');
jest.mock('../../../src/utils/docker');

const core = mocked(_core);
const utils = mocked(_utils);
const docker = mocked(_docker);
const datasources = mocked(_datasources);
const version = '1.22.4';

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.resetAllMocks();
    core.getInput.mockReturnValueOnce('dummy');
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/yarn.json'));
  });

  it('works yarn', async () => {
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '2.0.0-rc.24' }],
    });

    await run();

    expect(docker.build.mock.calls).toMatchSnapshot('build');
    expect(docker.publish.mock.calls).toMatchSnapshot('publish');
  });

  it('works pnpm', async () => {
    utils.readJson.mockReset();
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/pnpm.json'));
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version: '5.0.0' }, { version: '4.0.0-rc.24' }],
    });

    await run();

    expect(docker.build.mock.calls).toMatchSnapshot('build');
    expect(docker.publish.mock.calls).toMatchSnapshot('publish');
  });

  it('works dummy', async () => {
    utils.readJson.mockReset();
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/dummy.json'));

    await run();

    expect(docker.build.mock.calls).toMatchSnapshot('build');
    expect(docker.publish.mock.calls).toMatchSnapshot('publish');
  });

  it('last-only', async () => {
    utils.readJson.mockReset();
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/dummy.json'));
    core.getInput.mockReturnValueOnce('config.json');
    core.getInput.mockReturnValueOnce('true');

    await run();

    expect(docker.build.mock.calls).toMatchSnapshot('build');
    expect(docker.publish.mock.calls).toMatchSnapshot('publish');
  });

  it('build-only', async () => {
    core.getInput.mockReturnValueOnce('config.json');
    core.getInput.mockReturnValueOnce('true');
    core.getInput.mockReturnValueOnce('true');
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '2.0.0-rc.24' }],
    });

    await run();

    expect(docker.build.mock.calls).toMatchSnapshot('build');
    expect(docker.publish.mock.calls).toMatchSnapshot('publish');
  });

  it('updates image (dry-run)', async () => {
    utils.isDryRun.mockReturnValueOnce(true);
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '1.5.0' }],
    });

    await run();

    expect(docker.build.mock.calls).toMatchSnapshot('build');
    expect(docker.publish.mock.calls).toMatchSnapshot('publish');
  });

  it('no releases', async () => {
    datasources.getPkgReleases.mockResolvedValueOnce(null);
    await run();

    expect(docker.build.mock.calls).toEqual([]);
  });

  it('empty releases', async () => {
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [],
    });

    await run();
    expect(docker.build.mock.calls).toEqual([]);
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

    docker.build.mockRejectedValueOnce({});
    try {
      await run();
    } catch (e) {
      expect(e.message).toEqual('failed');
    }
  });
});
