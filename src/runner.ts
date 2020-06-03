import { setFailed } from '@actions/core';
import chalk from 'chalk';
import { Commands } from './types';
import { getArg, initCli, isCli } from './utils/cli';
import log from './utils/logger';

export default async function run(): Promise<void> {
  try {
    log.info(chalk.blue('Renovate Docker Builder'));
    if (isCli()) {
      await initCli();
    }
    const cmd = getArg('command') as Commands;
    log.info(chalk.yellow('Executing:'), ` ${cmd}`);
    switch (cmd) {
      case Commands.DockerBuilder:
        await (await import('./commands/docker/builder')).run();
        break;

      case Commands.DockerConfig:
        await (await import('./commands/docker/config')).run();
        break;

      default:
        log(chalk.yellow('args:'), chalk.grey(...process.argv));
        log.error(chalk.red('Unknown command:'), cmd);
        break;
    }
  } catch (error) {
    setFailed((error as Error).message);
  }
}
