import { describe, expect, it, vi } from 'vitest';
import { run } from '../../../src/commands/docker/config';

vi.mock('../../../src/utils/docker/buildx', () => ({
  init: () => Promise.resolve(),
}));

describe('commands/docker/config', () => {
  it('works', async () => {
    await expect(run()).resolves.toBeUndefined();
  });
});
