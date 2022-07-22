import * as _utils from '../../../src/util';
import {
  dockerDf,
  dockerPrune,
  dockerRun,
} from '../../../src/utils/docker/common';
import { mocked } from '../../utils';

jest.mock('../../../src/util');

const utils = mocked(_utils);

describe('utils/docker/common', () => {
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

  it('dockerRun', async () => {
    await dockerRun();
    expect(utils.exec.mock.calls).toMatchSnapshot();
  });
});
