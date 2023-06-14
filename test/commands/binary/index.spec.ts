/* eslint-disable @typescript-eslint/no-var-requires */
import { run } from '../../../src/commands/binary';
import * as _utils from '../../../src/util';
import * as _docker from '../../../src/utils/docker/common';
import * as _github from '../../../src/utils/github';
import { mocked } from '../../utils';
import * as _core from '@actions/core';
import * as _datasources from 'renovate/dist/modules/datasource';

jest.mock('renovate/dist/modules/datasource');
jest.mock('../../../src/util');
jest.mock('../../../src/utils/docker/common');
jest.mock('../../../src/utils/docker/buildx', () => ({
  init: () => Promise.resolve(),
}));
jest.mock('../../../src/utils/github');
jest.mock('../../../src/utils/datasource');
jest.mock('../../../src/utils/sum');

const core = mocked(_core);
const utils = mocked(_utils);
const docker = mocked(_docker);
const datasources = mocked(_datasources);
const github = mocked(_github);
const version = '2.7.2';

describe('commands/binary/index', () => {
  let input: Record<string, string>;

  beforeEach(() => {
    jest.resetAllMocks();
    input = {};
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- wrong core types
    core.getInput.mockImplementation((k) => input[k]!);
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/ruby.json'));
    utils.getArg.mockImplementation((_, o) => (o?.multi ? [] : ''));
    utils.getWorkspace.mockReturnValue('.');
  });

  it('works ruby', async () => {
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`
    );
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '3.0.0-rc.24' }],
    });

    github.hasAsset.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    await run();

    expect(docker.dockerRun).not.toHaveBeenCalled();
  });

  it('works ruby (dry-run)', async () => {
    utils.isDryRun.mockReturnValueOnce(true);
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`
    );
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '3.0.0-rc.24' }],
    });

    github.hasAsset.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    await run();

    expect(docker.dockerRun.mock.calls).toMatchSnapshot('docker');
  });

  it('works ruby (no-assets)', async () => {
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`
    );
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '3.0.0-rc.24' }],
    });

    github.hasAsset.mockResolvedValueOnce(false);

    await run();

    expect(docker.dockerRun.mock.calls).toMatchSnapshot('docker');
    expect(github.uploadAsset).toHaveBeenCalledTimes(2);
  });

  it('works ruby (misssing checksum)', async () => {
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`
    );
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '3.0.0-rc.24' }],
    });

    github.hasAsset.mockResolvedValueOnce(true);
    github.downloadAsset.mockResolvedValueOnce(true);

    await run();

    expect(docker.dockerRun).not.toHaveBeenCalled();
    expect(github.uploadAsset).toHaveBeenCalledTimes(1);
  });

  it('works ruby (misssing checksum,dry-run)', async () => {
    utils.isDryRun.mockReturnValueOnce(true);
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`
    );
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '3.0.0-rc.24' }],
    });

    github.hasAsset.mockResolvedValueOnce(true);
    github.downloadAsset.mockResolvedValueOnce(true);

    await run();

    expect(docker.dockerRun).not.toHaveBeenCalled();
    expect(github.uploadAsset).not.toHaveBeenCalled();
  });

  it('works ruby (misssing checksum fails)', async () => {
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`
    );
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '3.0.0-rc.24' }],
    });

    github.hasAsset.mockResolvedValueOnce(true);
    github.downloadAsset.mockResolvedValueOnce(true);
    github.uploadAsset.mockRejectedValueOnce(new Error('error'));

    await run();

    expect(docker.dockerRun).not.toHaveBeenCalled();
    expect(github.uploadAsset).toHaveBeenCalledTimes(1);
  });

  it('works dummy', async () => {
    utils.readJson.mockReset();
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/dummy.json'));
    utils.readFile.mockResolvedValue(``);

    github.hasAsset.mockResolvedValueOnce(true);

    await run();

    expect(docker.dockerRun.mock.calls).toMatchSnapshot('docker');
    expect(datasources.getPkgReleases).not.toHaveBeenCalled();
  });

  it('works python (dry-run)', async () => {
    utils.isDryRun.mockReturnValueOnce(true);
    utils.readJson.mockReset();
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/python.json'));
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=docker depName=python versioning=docker\nARG PYTHON_VERSION=3.9.1`
    );

    github.hasAsset.mockResolvedValueOnce(true);

    await run();

    expect(docker.dockerRun).not.toHaveBeenCalled();
    expect(datasources.getPkgReleases).not.toHaveBeenCalled();
    expect(github.uploadAsset).not.toHaveBeenCalled();
  });

  it('empty releases', async () => {
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [],
    });

    await run();
    expect(docker.dockerRun).not.toHaveBeenCalled();
    expect(github.updateRelease).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('No versions found.');
  });

  it('null releases', async () => {
    datasources.getPkgReleases.mockResolvedValueOnce(null);
    await run();
    expect(docker.dockerRun).not.toHaveBeenCalled();
    expect(github.updateRelease).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('No versions found.');
  });

  it('catch errors', async () => {
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`
    );
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '3.0.0-rc.24' }],
    });

    github.hasAsset.mockRejectedValueOnce(new Error('dummy'));

    await run();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed.mock.calls).toMatchSnapshot();
  });

  it('continues on errors', async () => {
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`
    );
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '3.0.0-rc.24' }],
    });

    docker.dockerRun.mockRejectedValueOnce(new Error('dummy'));

    await run();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed.mock.calls).toMatchSnapshot();
  });
});
