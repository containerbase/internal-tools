import * as _utils from '../../../src/util';
import { cosign } from '../../../src/utils/docker/cosign';
import { mocked } from '../../utils';

jest.mock('../../../src/util');

const utils = mocked(_utils);

describe('utils/docker/cosign', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('cosign', async () => {
    await cosign('version');
    expect(utils.exec.mock.calls).toMatchSnapshot();
  });
});
