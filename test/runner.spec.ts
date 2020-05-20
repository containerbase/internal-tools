import * as _core from '@actions/core';
import run from '../src/runner';
import { Commands } from '../src/types';
import { getName, mocked } from './utils';

jest.mock('../src/commands/docker/publish');
jest.mock('../src/commands/docker/config');
jest.mock('../src/commands/docker/builder');
jest.mock('../src/commands/github/cleanup');

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

  it(Commands.DockerBuilder, async () => {
    core.getInput.mockReturnValueOnce(Commands.DockerBuilder);
    await run();
    expect(core.getInput).toHaveBeenCalledWith('command');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it(Commands.DockerConfig, async () => {
    core.getInput.mockReturnValueOnce(Commands.DockerConfig);
    await run();
    expect(core.getInput).toHaveBeenCalledWith('command');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it(Commands.DockerPublish, async () => {
    core.getInput.mockReturnValueOnce(Commands.DockerPublish);
    await run();
    expect(core.getInput).toHaveBeenCalledWith('command');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it(Commands.GithubCleanup, async () => {
    core.getInput.mockReturnValueOnce(Commands.GithubCleanup);
    await run();
    expect(core.getInput).toHaveBeenCalledWith('command');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('catch error', async () => {
    core.getInput.mockImplementationOnce((_) => {
      throw new Error('test');
    });
    await run();

    expect(core.getInput.mock.calls).toMatchSnapshot();
    expect(core.setFailed).toHaveBeenCalledWith('test');
  });
});
