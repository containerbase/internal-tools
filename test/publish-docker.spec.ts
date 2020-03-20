import * as _core from '@actions/core';
import { getName, mocked } from './utils';
import * as _docker from '../src/utils/docker';
import * as _utils from '../src/util';
import { run } from '../src/publish-docker';

jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('fancy-log');
jest.mock('../src/util');
jest.mock('../src/utils/docker');

const core = mocked(_core);
const utils = mocked(_utils);
const docker = mocked(_docker);
const image = 'renovate/base';
const digest =
  'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a1';

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
    core.getInput.mockReturnValueOnce('').mockReturnValueOnce(image);
    docker.getLocalImageId.mockResolvedValueOnce(digest);
  });

  it('uptodate', async () => {
    docker.getRemoteImageId.mockResolvedValueOnce(digest);

    await run();

    expect(docker.getLocalImageId).toHaveBeenCalledWith(image);
    expect(docker.getRemoteImageId).toHaveBeenCalledWith(image);
    expect(utils.exec).not.toHaveBeenCalled();
  });

  it('updates image', async () => {
    docker.getLocalImageId.mockResolvedValueOnce(
      'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a2'
    );

    await run();

    expect(docker.getLocalImageId).toHaveBeenCalledWith(image);
    expect(docker.getRemoteImageId).toHaveBeenCalledWith(image);
    expect(utils.exec).toBeCalledTimes(1);
  });

  it('updates image (dry-run)', async () => {
    core.getInput.mockReset();
    core.getInput.mockReturnValueOnce('true').mockReturnValueOnce(image);
    docker.getLocalImageId.mockResolvedValueOnce(
      'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a2'
    );
    await run();

    expect(docker.getLocalImageId).toHaveBeenCalledWith(image);
    expect(docker.getRemoteImageId).toHaveBeenCalledWith(image);
    expect(utils.exec).not.toHaveBeenCalled();
  });

  it('throws no image', async () => {
    core.getInput.mockReset();
    await expect(run()).rejects.toThrow('Missing image');
  });
});
