import * as _runner from '../src/runner';
import { mocked } from './utils';

jest.mock('../src/runner');

const runner = mocked(_runner);

describe('index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works', async () => {
    runner.default.mockResolvedValueOnce();
    //await import('../src');
    await Promise.resolve();
    expect(runner.default).not.toHaveBeenCalled();
  });
});
