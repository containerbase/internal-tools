import { describe, expect, it, vi } from 'vitest';
import * as _utils from '../../../src/util';
import { init } from '../../../src/utils/docker/buildx';

vi.mock('../../../src/util');

const utils = vi.mocked(_utils);

describe('utils/docker/buildx', () => {
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
