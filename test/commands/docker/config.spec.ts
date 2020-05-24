import { run } from '../../../src/commands/docker/config';
import { getName } from '../../utils';

jest.mock('../../../src/utils/docker/buildx', () => ({
  init: () => Promise.resolve(),
}));

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('works', async () => {
    await expect(run()).resolves.toBeUndefined();
  });
});
