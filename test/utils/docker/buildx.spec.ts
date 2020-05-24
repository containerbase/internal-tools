import fs from 'fs';
import * as _utils from '../../../src/util';
import { init } from '../../../src/utils/docker/buildx';
import { getName, mocked } from '../../utils';

jest.mock('../../../src/util');

const utils = mocked(_utils);

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('works', async () => {
    utils.resolveFile.mockResolvedValue('./bin/file.sh');
    await init();
    expect(utils.exec.mock.calls).toMatchSnapshot();
  });

  it('already initialized', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    await init();
    expect(utils.exec.mock.calls).toEqual([]);
  });
});
