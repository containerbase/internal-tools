import * as _core from '@actions/core';
import { getName, mocked } from '../../utils';
import * as _docker from '../../../src/utils/docker';
import * as _utils from '../../../src/util';
import { run } from '../../../src/commands/docker/publish';

jest.mock('../../../src/util');
jest.mock('../../../src/utils/docker');

const core = mocked(_core);
const utils = mocked(_utils);
const docker = mocked(_docker);
const image = 'base';
const tag = 'latest';
// const digest =
//   'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a1';

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
    core.getInput.mockReturnValueOnce(image);
  });

  it('works', async () => {
    await run();

    expect(docker.publish).toHaveBeenCalledWith({
      image,
      tag,
      dryRun: undefined,
    });
  });

  it('works multiple', async () => {
    core.getInput.mockReturnValueOnce('test;latest');

    await run();

    expect(core.getInput).toBeCalledTimes(2);
    expect(docker.publish).toHaveBeenCalledTimes(2);
    expect(docker.publish).toHaveBeenNthCalledWith(1, {
      image,
      tag: 'test',
      dryRun: undefined,
    });
    expect(docker.publish).toHaveBeenNthCalledWith(2, {
      image,
      tag,
      dryRun: undefined,
    });
  });

  it('updates image', async () => {
    docker.getLocalImageId.mockResolvedValueOnce(
      'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a2'
    );

    await run();

    expect(docker.publish).toHaveBeenCalledWith({
      image,
      tag,
      dryRun: undefined,
    });
  });

  it('updates image (dry-run)', async () => {
    utils.isDryRun.mockReturnValueOnce(true);

    await run();

    expect(core.getInput).toBeCalledTimes(2);
    expect(docker.publish).toHaveBeenCalledWith({ image, tag, dryRun: true });
  });

  it('throws no image', async () => {
    core.getInput.mockReset();
    await expect(run()).rejects.toThrow('Missing image');
  });
});
