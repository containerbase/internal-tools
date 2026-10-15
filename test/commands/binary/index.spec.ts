import { resolve } from 'node:path';
import * as _core from '@actions/core';
import * as _datasources from 'renovate/dist/modules/datasource';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from '../../../src/commands/binary';
import * as _utils from '../../../src/util';
import * as _docker from '../../../src/utils/docker/common';
import * as _github from '../../../src/utils/github';
import log from '../../../src/utils/logger';
import * as _sum from '../../../src/utils/sum';

vi.mock('renovate/dist/modules/datasource');
vi.mock('../../../src/util');
vi.mock('../../../src/utils/docker/common');
vi.mock('../../../src/utils/docker/buildx', () => ({
  init: () => Promise.resolve(),
}));
vi.mock('../../../src/utils/github');
vi.mock('../../../src/utils/datasource');
vi.mock('../../../src/utils/sum');

const core = vi.mocked(_core);
const utils = vi.mocked(_utils);
const docker = vi.mocked(_docker);
const datasources = vi.mocked(_datasources);
const github = vi.mocked(_github);
const sum = vi.mocked(_sum);
const version = '2.7.2';

describe('commands/binary/index', () => {
  let input: Record<string, string>;

  beforeEach(() => {
    input = {};
    core.getInput.mockImplementation((k) => input[k]!);
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/ruby.json'));
    utils.getArg.mockImplementation((_, o) => (o?.multi ? [] : ''));
    utils.getWorkspace.mockReturnValue('.');
  });

  it('works ruby', async () => {
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`,
    );
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '3.0.0-rc.24' }],
    });

    github.hasAsset.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    await run();

    expect(docker.dockerRun).not.toHaveBeenCalled();
    expect(github.uploadVersionAsset).not.toHaveBeenCalled();
  });

  it('works ruby (dry-run)', async () => {
    utils.isDryRun.mockReturnValueOnce(true);
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`,
    );
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '3.0.0-rc.24' }],
    });

    github.hasAsset.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    github.hasVersionAsset.mockResolvedValueOnce(true);

    await run();

    expect(docker.dockerRun.mock.calls).toMatchSnapshot('docker');
    expect(github.uploadVersionAsset).not.toHaveBeenCalled();
  });

  it('works ruby (no-assets)', async () => {
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`,
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
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`,
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
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`,
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
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`,
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
      `# renovate: datasource=docker depName=python versioning=docker\nARG PYTHON_VERSION=3.9.1`,
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
    expect(core.setFailed).toHaveBeenCalledExactlyOnceWith(
      'No versions found.',
    );
  });

  it('null releases', async () => {
    datasources.getPkgReleases.mockResolvedValueOnce(null);
    await run();
    expect(docker.dockerRun).not.toHaveBeenCalled();
    expect(github.updateRelease).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledExactlyOnceWith(
      'No versions found.',
    );
  });

  it('catch errors', async () => {
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`,
    );
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }, { version: '3.0.0-rc.24' }],
    });

    github.hasAsset.mockRejectedValueOnce(new Error('dummy'));

    await run();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed.mock.calls).toMatchSnapshot();
  });

  describe('test hook', () => {
    beforeEach(() => {
      utils.readJson.mockReset();
      utils.readJson.mockResolvedValueOnce({
        image: 'ruby',
        datasource: 'github-releases',
        startVersion: '2.5.0',
        test: 'bin/test.sh',
      });
      utils.readFile.mockResolvedValue(
        `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`,
      );
      datasources.getPkgReleases.mockResolvedValueOnce({
        releases: [{ version }],
      });
      github.hasAsset.mockResolvedValueOnce(false);
    });

    it('runs the test after the build and before the upload', async () => {
      await run();

      expect(utils.exec).toHaveBeenCalledExactlyOnceWith(
        resolve('bin/test.sh'),
        [resolve('.cache/ruby-2.7.2.tar.xz'), version],
        { cwd: '.' },
      );
      const testOrder = utils.exec.mock.invocationCallOrder[0]!;
      expect(docker.dockerRun.mock.invocationCallOrder[0]).toBeLessThan(
        testOrder,
      );
      expect(sum.createChecksum.mock.invocationCallOrder[0]).toBeGreaterThan(
        testOrder,
      );
      expect(github.uploadAsset).toHaveBeenCalledTimes(2);
      expect(core.setFailed).not.toHaveBeenCalled();
    });

    it('fails the version when the test fails', async () => {
      utils.exec.mockRejectedValueOnce(new Error('test failed'));

      await run();

      expect(utils.exec).toHaveBeenCalledOnce();
      expect(sum.createChecksum).not.toHaveBeenCalled();
      expect(github.uploadAsset).not.toHaveBeenCalled();
      expect(core.setFailed).toHaveBeenCalledExactlyOnceWith(
        `Versions failed: ${version}`,
      );
    });

    it('runs the test in dry-run', async () => {
      utils.isDryRun.mockReturnValueOnce(true);

      await run();

      expect(utils.exec).toHaveBeenCalledOnce();
      expect(github.uploadAsset).not.toHaveBeenCalled();
      expect(core.setFailed).not.toHaveBeenCalled();
    });
  });

  it('does not run a test when none is configured', async () => {
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`,
    );
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version }],
    });
    github.hasAsset.mockResolvedValueOnce(false);

    await run();

    expect(docker.dockerRun).toHaveBeenCalledOnce();
    expect(utils.exec).not.toHaveBeenCalled();
    expect(github.uploadAsset).toHaveBeenCalledTimes(2);
  });

  describe('build limit', () => {
    const versions = ['2.7.0', '2.7.1', '2.7.2'];

    beforeEach(() => {
      utils.readFile.mockResolvedValue(
        `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`,
      );
      datasources.getPkgReleases.mockResolvedValueOnce({
        releases: versions.map((v) => ({ version: v })),
      });
    });

    /** Mocks the `build-limit` input. */
    function mockBuildLimit(limit: string): void {
      utils.getArg.mockImplementation((name, o) =>
        o?.multi ? [] : name === 'build-limit' ? limit : '',
      );
    }

    it('builds all missing versions by default', async () => {
      await run();

      expect(docker.dockerRun.mock.calls.map((c) => c.at(-1))).toEqual(
        versions,
      );
      expect(log.info).not.toHaveBeenCalledWith(
        'Build limit reached:',
        expect.anything(),
      );
      expect(core.setFailed).not.toHaveBeenCalled();
    });

    it('stops after the limit', async () => {
      mockBuildLimit('2');

      await run();

      expect(docker.dockerRun.mock.calls.map((c) => c.at(-1))).toEqual([
        '2.7.0',
        '2.7.1',
      ]);
      expect(github.uploadAsset).toHaveBeenCalledTimes(4);
      expect(log.info).toHaveBeenCalledWith('Build limit reached:', 2);
      expect(core.setFailed).not.toHaveBeenCalled();
    });

    it('does not count existing versions', async () => {
      mockBuildLimit('1');
      github.hasAsset
        // 2.7.0: archive and checksum exist
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        // 2.7.1: only the checksum is missing
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        // 2.7.2: missing
        .mockResolvedValueOnce(false);
      github.downloadAsset.mockResolvedValueOnce(true);

      await run();

      expect(docker.dockerRun).toHaveBeenCalledOnce();
      expect(docker.dockerRun.mock.calls[0]?.at(-1)).toBe('2.7.2');
      expect(log.info).not.toHaveBeenCalledWith(
        'Build limit reached:',
        expect.anything(),
      );
      expect(core.setFailed).not.toHaveBeenCalled();
    });

    it('fails on an invalid limit', async () => {
      mockBuildLimit('0');

      await run();

      expect(docker.dockerRun).not.toHaveBeenCalled();
      expect(core.setFailed).toHaveBeenCalledExactlyOnceWith(
        new Error('Invalid build-limit: 0'),
      );
    });
  });

  it('continues on errors', async () => {
    utils.readFile.mockResolvedValue(
      `# renovate: datasource=ruby-version depName=ruby-version versioning=ruby\nARG RUBY_VERSION=${version}\n`,
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
