import * as _core from '@actions/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBuilderImage,
  getConfig,
  runBuilder,
  runTest,
} from '../../../src/commands/binary/utils';
import * as _utils from '../../../src/util';
import * as _docker from '../../../src/utils/docker/common';
import type { BinaryBuilderConfig } from '../../../src/utils/types';
import { partial } from '../../utils';

vi.mock('../../../src/util');
vi.mock('../../../src/utils/docker/common');

const core = vi.mocked(_core);
const docker = vi.mocked(_docker);
const utils = vi.mocked(_utils);

vi.mock('../../../src/util');

describe('commands/binary/utils', () => {
  let input: Record<string, string>;

  beforeEach(() => {
    input = {};
    core.getInput.mockImplementation((k) => input[k]!);
    utils.getArg.mockImplementation((_, o) => (o?.multi ? [] : ''));
  });

  describe('getConfig', () => {
    it('ruby', async () => {
      utils.readJson.mockResolvedValueOnce(require('./__fixtures__/ruby.json'));
      expect(await getConfig()).toMatchSnapshot();
    });

    it('dummy', async () => {
      utils.readJson.mockResolvedValueOnce(require('./__fixtures__/dummy.json'));
      expect(await getConfig()).toMatchSnapshot();
    });

    it('dummy (no-image)', async () => {
      input.image = 'dummy';
      utils.readJson.mockResolvedValueOnce({ datasource: 'github-releases' });
      expect(await getConfig()).toMatchSnapshot();
    });

    it('throws', async () => {
      utils.readJson.mockResolvedValueOnce(null);
      await expect(getConfig()).rejects.toThrow();
    });

    it('reads the build limit', async () => {
      utils.getArg.mockImplementation((name, o) =>
        o?.multi ? [] : name === 'build-limit' ? '5' : '',
      );
      utils.readJson.mockResolvedValueOnce({ image: 'git' });
      expect(await getConfig()).toMatchObject({ buildLimit: 5 });
    });

    it.each(['0', '-1', '1.5', 'abc'])('throws on build limit %s', async (limit) => {
      utils.getArg.mockImplementation((name, o) =>
        o?.multi ? [] : name === 'build-limit' ? limit : '',
      );
      utils.readJson.mockResolvedValueOnce({ image: 'git' });
      await expect(getConfig()).rejects.toThrow(`Invalid build-limit: ${limit}`);
    });
  });

  describe('createBuilderImage', () => {
    it('works', async () => {
      await expect(createBuilderImage('', partial<BinaryBuilderConfig>({}))).toResolve();
    });

    it('works with build args', async () => {
      utils.getArch.mockReturnValueOnce('aarch64');
      utils.getDistro.mockReturnValueOnce('focal');
      await createBuilderImage('', partial<BinaryBuilderConfig>({ buildArgs: ['FLAVOR=focal'] }));

      expect(docker.dockerBuildx).toHaveBeenCalledTimes(1);
      expect(docker.dockerBuildx.mock.calls).toMatchSnapshot();
    });
  });

  describe('runBuilder', () => {
    it('works with build args', async () => {
      utils.getArch.mockReturnValueOnce('aarch64');
      await runBuilder('.', '1.2.3');

      expect(docker.dockerRun).toHaveBeenCalledTimes(1);
      expect(docker.dockerRun.mock.calls).toMatchSnapshot();
    });
  });

  describe('runTest', () => {
    it('does nothing without a test', async () => {
      await runTest('/ws', partial<BinaryBuilderConfig>({ image: 'git' }), '1');

      expect(utils.exec).not.toHaveBeenCalled();
    });

    it('runs the test script with archive and version', async () => {
      utils.getDistro.mockReturnValueOnce('noble');
      utils.getArch.mockReturnValueOnce('aarch64');
      await runTest(
        '/ws',
        partial<BinaryBuilderConfig>({ image: 'git', test: 'bin/test.sh' }),
        '2.51.0',
      );

      expect(utils.exec).toHaveBeenCalledExactlyOnceWith(
        '/ws/bin/test.sh',
        ['/ws/.cache/git-2.51.0-noble-aarch64.tar.xz', '2.51.0'],
        { cwd: '/ws' },
      );
    });

    it('rethrows a failing test', async () => {
      utils.exec.mockRejectedValueOnce(new Error('test failed'));

      await expect(
        runTest(
          '/ws',
          partial<BinaryBuilderConfig>({ image: 'git', test: 'bin/test.sh' }),
          '2.51.0',
        ),
      ).rejects.toThrow('test failed');
    });
  });
});
