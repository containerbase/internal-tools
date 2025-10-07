import { describe, expect, it, vi } from 'vitest';
import * as _utils from '../../../src/util';
import { cosign } from '../../../src/utils/docker/cosign';

vi.mock('../../../src/util');

const utils = vi.mocked(_utils);

describe('utils/docker/cosign', () => {
  it('cosign', async () => {
    await cosign('version');
    expect(utils.exec.mock.calls).toMatchSnapshot();
  });
});
