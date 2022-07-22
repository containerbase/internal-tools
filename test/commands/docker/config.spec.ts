import { run } from '../../../src/commands/docker/config';

jest.mock('../../../src/utils/docker/buildx', () => ({
  init: () => Promise.resolve(),
}));

describe('commands/docker/config', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('works', async () => {
    await expect(run()).resolves.toBeUndefined();
  });
});
