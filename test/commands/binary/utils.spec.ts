/* eslint-disable @typescript-eslint/no-var-requires */
import * as _core from '@actions/core';
import { getConfig } from '../../../src/commands/binary/utils';
import * as _utils from '../../../src/util';
import { getName, mocked } from '../../utils';

jest.mock('renovate/dist/datasource');
jest.mock('../../../src/util');
jest.mock('../../../src/utils/docker');
jest.mock('../../../src/utils/docker/buildx', () => ({
  init: () => Promise.resolve(),
}));
jest.mock('../../../src/utils/datasource');

const core = mocked(_core);
const utils = mocked(_utils);

jest.mock('../../../src/util');

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.resetAllMocks();
    core.getInput.mockReturnValueOnce('builder.json');
    core.getInput.mockReturnValueOnce('yarn');
    utils.getArg.mockImplementation((_, o) => (o?.multi ? [] : ''));
  });

  it('ruby', async () => {
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/ruby.json'));
    expect(await getConfig('builder.json')).toMatchSnapshot();
  });

  it('dummy', async () => {
    utils.readJson.mockResolvedValueOnce(require('./__fixtures__/dummy.json'));
    expect(await getConfig('builder.json')).toMatchSnapshot();
  });
});
