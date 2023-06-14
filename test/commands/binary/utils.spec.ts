/* eslint-disable @typescript-eslint/no-var-requires */
import {
  createBuilderImage,
  getConfig,
  runBuilder,
} from '../../../src/commands/binary/utils';
import * as _utils from '../../../src/util';
import * as _docker from '../../../src/utils/docker/common';
import type { BinaryBuilderConfig } from '../../../src/utils/types';
import { mocked, partial } from '../../utils';
import * as _core from '@actions/core';

jest.mock('../../../src/util');
jest.mock('../../../src/utils/docker/common');

const core = mocked(_core);
const docker = mocked(_docker);
const utils = mocked(_utils);

jest.mock('../../../src/util');

describe('commands/binary/utils', () => {
  let input: Record<string, string>;

  beforeEach(() => {
    jest.resetAllMocks();
    input = {};
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- wrong core types
    core.getInput.mockImplementation((k) => input[k]!);
    utils.getArg.mockImplementation((_, o) => (o?.multi ? [] : ''));
  });

  describe('getConfig', () => {
    it('ruby', async () => {
      utils.readJson.mockResolvedValueOnce(require('./__fixtures__/ruby.json'));
      expect(await getConfig()).toMatchSnapshot();
    });

    it('dummy', async () => {
      utils.readJson.mockResolvedValueOnce(
        require('./__fixtures__/dummy.json')
      );
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
  });

  describe('createBuilderImage', () => {
    it('works', async () => {
      await expect(
        createBuilderImage('', partial<BinaryBuilderConfig>({}))
      ).toResolve();
    });

    it('works with build args', async () => {
      utils.getArch.mockReturnValueOnce('aarch64');
      await createBuilderImage(
        '',
        partial<BinaryBuilderConfig>({ buildArgs: ['FLAVOR=focal'] })
      );

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
});
