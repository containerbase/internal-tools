import { describe, expect, it, vi } from 'vitest';
import * as _runner from '../src/runner';
import { mocked } from './utils';

vi.mock('../src/runner');

const runner = mocked(_runner);

describe('index', () => {
  it('works', async () => {
    runner.default.mockResolvedValueOnce();
    await import('../src');
    expect(runner.default).toHaveBeenCalled();
  });
});
