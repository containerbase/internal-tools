import { getInput, setFailed } from '@actions/core';
import chalk from 'chalk';
import log from './utils/logger';
import { Commands } from './types';

export default async function run(): Promise<void> {
  try {
    log.info(chalk.blue('Renovate Docker Builder'));
    const cmd = getInput('command') as Commands;
    log.info(chalk.yellow('Executing:'), ` ${cmd}`);
    switch (cmd) {
      case Commands.PublishDocker:
        await (await import('./publish-docker')).run();
        break;
      case Commands.GithubCleanup:
        await (await import('./commands/cleanup')).run();
        break;
      default:
        log.warn(chalk.red('Unknown command:'), cmd);
        break;
    }
  } catch (error) {
    log.error('Error', error);
    setFailed(error.message);
  }
}
