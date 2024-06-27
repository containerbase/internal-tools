import * as _core from '@actions/core';
import { describe, expect, it, vi } from 'vitest';
import run from '../src/runner';
import { Commands } from '../src/types';
import { mocked } from './utils';

vi.mock('../src/commands/docker/config');
vi.mock('../src/commands/docker/builder');
vi.mock('../src/commands/binary');

const core = mocked(_core);

describe('runner', () => {
  it('works', async () => {
    core.getInput.mockReturnValueOnce('works');
    await run();

    expect(core.getInput.mock.calls).toMatchSnapshot();
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it(`${Commands.BinaryBuilder}`, async () => {
    core.getInput.mockReturnValueOnce(Commands.BinaryBuilder);
    await run();
    expect(core.getInput).toHaveBeenCalledWith('command');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it(`${Commands.DockerBuilder}`, async () => {
    core.getInput.mockReturnValueOnce(Commands.DockerBuilder);
    await run();
    expect(core.getInput).toHaveBeenCalledWith('command');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it(`${Commands.DockerConfig}`, async () => {
    core.getInput.mockReturnValueOnce(Commands.DockerConfig);
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
