import { getName, mocked } from '../utils';
import * as _utils from '../../src/util';
import { run } from '../../src/commands/cleanup';

jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('../../src/util');
jest.mock('../../src/utils/logger');

const utils = mocked(_utils);

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // core.getInput.mockReturnValueOnce(image);
  });

  it('throws', async () => {
    expect.assertions(1);
    utils.isDryRun.mockReturnValueOnce(true);

    try {
      await run();
    } catch (e) {
      expect(e).toMatchSnapshot(e);
    }
  });
});
