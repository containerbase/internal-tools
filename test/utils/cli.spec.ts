import * as _core from '@actions/core';
import * as cli from '../../src/utils/cli';
import { getName, mocked } from '../utils';

jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('../src/utils/logger');

const core = mocked(_core);

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getArg', () => {
    it('single', () => {
      core.getInput.mockReturnValueOnce('test;latest;slim');
      expect(cli.getArg('dockerfile')).toBe('test;latest;slim');
    });

    it('multi', () => {
      core.getInput.mockReturnValueOnce('test;latest;slim');
      expect(cli.getArg('dockerfile', { multi: true })).toEqual([
        'test',
        'latest',
        'slim',
      ]);
    });

    it('multi (null)', () => {
      expect(cli.getArg('dockerfile', { multi: true })).toEqual([]);
    });
  });
});
