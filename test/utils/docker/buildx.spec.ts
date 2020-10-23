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
    utils.exec.mockResolvedValueOnce({
      code: 0,
      stdout:
        'NAME/NODE           DRIVER/ENDPOINT                STATUS   PLATFORMS\n',
      stderr: '',
    });
    await init();
    expect(utils.exec.mock.calls).toMatchSnapshot();
  });

  it('already initialized', async () => {
    utils.exec.mockResolvedValueOnce({
      code: 0,
      stdout:
        'NAME/NODE           DRIVER/ENDPOINT                STATUS   PLATFORMS\nrenovatebot-builder    docker-container\n',
      stderr: '',
    });
    await init();
    expect(utils.exec).toHaveBeenCalledTimes(1);
    expect(utils.exec.mock.calls).toMatchSnapshot();
  });
});
