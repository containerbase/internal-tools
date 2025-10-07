import * as _core from '@actions/core';
import chalk from 'chalk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import log from '../../src/utils/logger';

vi.unmock('../../src/utils/logger');
vi.mock('strip-ansi');

const core = vi.mocked(_core);

describe('utils/logger', () => {
  const logger = vi.fn();

  beforeEach(() => {
    console.log = logger;
    console.dir = logger;
  });

  it('works', () => {
    log('test');
    log.dir({ name: 'test', code: 1 });
    log.info(chalk.gray('test'), 'it');
    log.warn(chalk.yellow('test'), 'it');
    log.error(chalk.red('test'));

    expect(logger.mock.calls).toMatchSnapshot();
    expect(core.warning).toHaveBeenCalled();
    expect(core.error).toHaveBeenCalled();
  });
});
