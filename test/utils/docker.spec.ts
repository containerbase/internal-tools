import { describe, expect, it, vi } from 'vitest';
import * as _utils from '../../src/util';
import { build } from '../../src/utils/docker';
import { ExecError } from '../../src/utils/types';
import { mocked } from '../utils';

vi.mock('node:timers/promises');
vi.mock('../../src/util');

const utils = mocked(_utils);
const res = { code: 0, stdout: '', stderr: '' };

const imagePrefix = 'renovate';

describe('utils/docker', () => {
  describe('build', () => {
    const image = 'base';
    const cache = 'docker-build-cache';

    it('works', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
      });

      await build({
        imagePrefix,
        image,
        buildArgs: [],
        tags: ['5'],
        push: true,
        platforms: ['linux/arm64'],
      });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });

    it('uses cache', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
      });

      await build({
        imagePrefix,
        imagePrefixes: ['ghcr.io/renovatebot'],
        image,
        cache: 'ghcr.io/renovatebot/docker-build-cache',
        cacheToTags: ['dummy'],
        push: true,
      });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });

    it('uses cache (dry-run)', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
      });

      await build({
        imagePrefix,
        image,
        cache,
        cacheFromTags: ['dummy'],
        dryRun: true,
        buildArgs: ['IMAGE=slim'],
      });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });

    it('retries', async () => {
      utils.exec.mockRejectedValueOnce(
        new ExecError(1, 'failed', 'unexpected status: 400 Bad Request', ''),
      );
      utils.exec.mockResolvedValueOnce({
        ...res,
      });

      await build({ imagePrefix, image });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });

    it('throws', async () => {
      utils.exec.mockRejectedValueOnce(
        new ExecError(1, 'failed', 'unexpected status: 400 Bad Request', ''),
      );
      utils.exec.mockRejectedValueOnce(new Error('failure'));

      await expect(build({ imagePrefix, image })).rejects.toThrow('failure');

      expect(utils.exec.mock.calls).toMatchSnapshot();
    });
  });
});
