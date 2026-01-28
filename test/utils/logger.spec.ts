import { styleText } from 'node:util';
import * as _core from '@actions/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import log from '../../src/utils/logger';

vi.unmock('../../src/utils/logger');
vi.mock('strip-ansi');

const core = vi.mocked(_core);

describe('utils/logger', () => {
  const logger = vi.fn();
  // needed for tests
  process.env.FORCE_COLOR = '1';

  beforeEach(() => {
    console.log = logger;
    console.dir = logger;
  });

  it('works', () => {
    log('test');
    log.dir({ name: 'test', code: 1 });
    log.info(styleText('gray', 'test'), 'it');
    log.warn(styleText('yellow', 'test'), 'it');
    log.error(styleText('red', 'test'));

    expect(logger.mock.calls).toMatchSnapshot();
    expect(core.warning).toHaveBeenCalled();
    expect(core.error).toHaveBeenCalled();
  });
});
