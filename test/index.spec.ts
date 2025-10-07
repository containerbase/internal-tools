import { describe, expect, it, vi } from 'vitest';
import * as _runner from '../src/runner';

vi.mock('../src/runner');

const runner = vi.mocked(_runner);

describe('index', () => {
  it('works', async () => {
    runner.default.mockResolvedValueOnce();
    await import('../src');
    expect(runner.default).toHaveBeenCalled();
  });
});
