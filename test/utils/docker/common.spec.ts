import * as _utils from '../../../src/util';
import { dockerDf, dockerPrune } from '../../../src/utils/docker/common';
import { getName, mocked } from '../../utils';

jest.mock('../../../src/util');

const utils = mocked(_utils);

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('dockerPrune', async () => {
    await dockerPrune();
    expect(utils.exec.mock.calls).toMatchSnapshot();
  });

  it('dockerDf', async () => {
    await dockerDf();
    expect(utils.exec.mock.calls).toMatchSnapshot();
  });
});
