import * as _utils from '../../../src/util';
import { cosign } from '../../../src/utils/cosign/common';
import { mocked } from '../../utils';

jest.mock('../../../src/util');

const utils = mocked(_utils);

describe('utils/cosign', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('cosign', async () => {
    await cosign('version');
    expect(utils.exec.mock.calls).toMatchSnapshot();
  });
});
