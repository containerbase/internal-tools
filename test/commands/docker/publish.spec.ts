import * as _core from '@actions/core';
import { getName, mocked } from '../../utils';
import * as _docker from '../../../src/utils/docker';
import * as _utils from '../../../src/util';
import { run } from '../../../src/commands/docker/publish';

jest.mock('../../../src/util');
jest.mock('../../../src/utils/docker');
jest.mock('../../../src/utils/logger');

const core = mocked(_core);
const utils = mocked(_utils);
const docker = mocked(_docker);
const image = 'renovate/base';
const tag = 'latest';
const digest =
  'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a1';

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
    core.getInput.mockReturnValueOnce(image);
    docker.getLocalImageId.mockResolvedValueOnce(digest);
  });

  it('uptodate', async () => {
    docker.getRemoteImageId.mockResolvedValueOnce(digest);

    await run();

    expect(docker.getLocalImageId).toHaveBeenCalledWith(image, tag);
    expect(docker.getRemoteImageId).toHaveBeenCalledWith(image, tag);
    expect(utils.exec).not.toHaveBeenCalled();
  });

  it('uptodate multiple', async () => {
    core.getInput.mockReturnValueOnce('test;latest');
    docker.getLocalImageId.mockResolvedValueOnce(digest);
    docker.getRemoteImageId
      .mockResolvedValueOnce(digest)
      .mockResolvedValueOnce(digest);

    await run();

    expect(core.getInput).toBeCalledTimes(2);
    expect(docker.getLocalImageId).toHaveBeenNthCalledWith(1, image, 'test');
    expect(docker.getLocalImageId).toHaveBeenNthCalledWith(2, image, tag);
    expect(docker.getLocalImageId).toHaveBeenCalledTimes(2);
    expect(docker.getRemoteImageId).toHaveBeenNthCalledWith(1, image, 'test');
    expect(docker.getRemoteImageId).toHaveBeenNthCalledWith(2, image, tag);
    expect(docker.getRemoteImageId).toHaveBeenCalledTimes(2);
    expect(utils.exec).not.toHaveBeenCalled();
  });

  it('updates image', async () => {
    docker.getLocalImageId.mockResolvedValueOnce(
      'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a2'
    );

    await run();

    expect(docker.getLocalImageId).toHaveBeenCalledWith(image, tag);
    expect(docker.getRemoteImageId).toHaveBeenCalledWith(image, tag);
    expect(utils.exec).toBeCalledTimes(1);
  });

  it('updates image (dry-run)', async () => {
    utils.isDryRun.mockReturnValueOnce(true);
    docker.getLocalImageId.mockResolvedValueOnce(
      'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a2'
    );
    await run();

    expect(core.getInput).toBeCalledTimes(2);
    expect(docker.getLocalImageId).toHaveBeenCalledWith(image, tag);
    expect(docker.getRemoteImageId).toHaveBeenCalledWith(image, tag);
    expect(utils.exec).not.toHaveBeenCalled();
  });

  it('throws no image', async () => {
    core.getInput.mockReset();
    await expect(run()).rejects.toThrow('Missing image');
  });
});
