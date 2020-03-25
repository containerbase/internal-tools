import * as _core from '@actions/core';
import { getName, mocked } from './utils';
import run from '../src/runner';
import { Commands } from '../src/types';

jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('../src/utils/logger');
jest.mock('../src/publish-docker');
jest.mock('../src/commands/cleanup');

const core = mocked(_core);

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works', async () => {
    core.getInput.mockReturnValueOnce('works');
    await run();

    expect(core.getInput.mock.calls).toMatchSnapshot();
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('publish-docker', async () => {
    core.getInput.mockReturnValueOnce(Commands.PublishDocker);
    await run();
    expect(core.getInput).toBeCalledWith('command');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('github-cleanup', async () => {
    core.getInput.mockReturnValueOnce(Commands.GithubCleanup);
    await run();
    expect(core.getInput).toBeCalledWith('command');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('catch error', async () => {
    core.getInput.mockImplementationOnce(_ => {
      throw new Error('test');
    });
    await run();

    expect(core.getInput.mock.calls).toMatchSnapshot();
    expect(core.setFailed).toHaveBeenCalledWith('test');
  });
});
