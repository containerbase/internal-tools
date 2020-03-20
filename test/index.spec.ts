import { getName, mocked } from './utils';
import * as _runner from '../src/runner';

jest.mock('../src/runner');

const runner = mocked(_runner);

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works', async () => {
    await import('../src');
    expect(runner.default).toHaveBeenCalled();
  });
});
