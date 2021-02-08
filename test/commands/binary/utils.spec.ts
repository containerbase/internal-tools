/* eslint-disable @typescript-eslint/no-var-requires */
import * as _core from '@actions/core';
import {
  createBuilderImage,
  getConfig,
} from '../../../src/commands/binary/utils';
import * as _utils from '../../../src/util';
import * as _docker from '../../../src/utils/docker/common';
import { BinaryBuilderConfig } from '../../../src/utils/types';
import { getName, mocked, partial } from '../../utils';

jest.mock('../../../src/util');
jest.mock('../../../src/utils/docker/common');

const core = mocked(_core);
const docker = mocked(_docker);
const utils = mocked(_utils);

jest.mock('../../../src/util');

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.resetAllMocks();
    core.getInput.mockReturnValueOnce('builder.json');
    core.getInput.mockReturnValueOnce('yarn');
    utils.getArg.mockImplementation((_, o) => (o?.multi ? [] : ''));
  });

  it('ruby', async () => {
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/ruby.json'));
    expect(await getConfig('builder.json')).toMatchSnapshot();
  });

  it('dummy', async () => {
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/dummy.json'));
    expect(await getConfig('builder.json')).toMatchSnapshot();
  });

  describe('createBuilderImage', () => {
    it('works', async () => {
      await createBuilderImage('', partial<BinaryBuilderConfig>({}));
    });

    it('works with build args', async () => {
      await createBuilderImage(
        '',
        partial<BinaryBuilderConfig>({ buildArgs: ['FLAVOR=focal'] })
      );

      expect(docker.dockerBuildx).toHaveBeenCalled();
      expect(docker.dockerBuildx.mock.calls).toMatchSnapshot();
    });
  });
});
