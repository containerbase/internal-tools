import { getName, mocked } from './utils';
import * as _exec from '@actions/exec';
import * as util from '../src/util';

jest.mock('@actions/exec');
jest.mock('fancy-log');

const exec = mocked(_exec);

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works', async () => {
    exec.exec.mockImplementationOnce((cmd, args, opts) => {
      opts?.listeners?.stdout && opts.listeners.stdout(Buffer.from('test'));
      opts?.listeners?.stderr && opts.listeners.stderr(Buffer.from('testerr'));
      return Promise.resolve(0);
    });
    expect(await util.exec('dummy-cmd', [])).toEqual({
      code: 0,
      stdout: 'test',
      stderr: 'testerr',
    });
  });

  it('throws', async () => {
    expect.assertions(1);
    exec.exec.mockResolvedValueOnce(1);
    await expect(util.exec('dummy-cmd', [])).rejects.toThrow();
  });
});
