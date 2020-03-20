import * as _core from '@actions/core';
import { getName, mocked } from './utils';
import * as _utils from '../src/util';
import { run } from '../src/publish-docker';

jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('fancy-log');
jest.mock('../src/util.ts');

const core = mocked(_core);
const utils = mocked(_utils);
const res = { code: 0, stdout: '', stderr: '' };

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uptodate', async () => {
    core.getInput.mockReturnValueOnce('test/image');
    utils.exec
      .mockResolvedValueOnce({
        ...res,
        stdout:
          '[renovate/base@sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a1]',
      })
      .mockResolvedValueOnce(res)
      .mockResolvedValueOnce(res)
      .mockResolvedValueOnce({
        ...res,
        stdout:
          '[renovate/base@sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a1]',
      });

    await run();

    expect(utils.exec).toBeCalledTimes(4);
  });

  it('updates digest', async () => {
    core.getInput.mockReturnValueOnce('test/image');
    utils.exec
      .mockResolvedValueOnce({
        ...res,
        stdout:
          '[renovate/base@sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a1]',
      })
      .mockResolvedValueOnce(res)
      .mockResolvedValueOnce(res)
      .mockResolvedValueOnce({
        ...res,
        stdout:
          '[renovate/base@sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a2]',
      });

    await run();

    expect(utils.exec).toBeCalledTimes(6);
  });

  it('no digest', async () => {
    core.getInput.mockReturnValueOnce('test/image');
    expect.assertions(1);
    utils.exec.mockResolvedValueOnce({
      ...res,
      stdout: '',
    });

    try {
      await run();
    } catch (e) {
      expect(e).toMatchSnapshot();
    }
  });

  it('missing image', async () => {
    expect.assertions(1);
    utils.exec.mockResolvedValueOnce({
      ...res,
      stdout: '',
    });

    try {
      await run();
    } catch (e) {
      expect(e).toMatchSnapshot();
    }
  });
});
