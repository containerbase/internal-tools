import * as _core from '@actions/core';
import { getName, mocked } from '../../utils';
import * as _utils from '../../../src/util';
import { run } from '../../../src/commands/docker/config';

jest.mock('renovate/dist/workers/global/cache');
jest.mock('renovate/dist/datasource');
jest.mock('../../../src/util');
jest.mock('../../../src/utils/docker');

const core = mocked(_core);
const utils = mocked(_utils);

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.resetAllMocks();
    core.group.mockImplementation((_, f) => f());
  });

  it('works', async () => {
    utils.resolveFile.mockResolvedValue('./bin/file.sh');
    await run();
    expect(_utils.exec).toBeCalledWith('./bin/file.sh', []);
  });
});
