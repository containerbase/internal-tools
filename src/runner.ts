import { getInput, setFailed } from '@actions/core';
import chalk from 'chalk';
import { Commands } from './types';
import log from './utils/logger';

export default async function run(): Promise<void> {
  try {
    log.info(chalk.blue('Renovate Docker Builder'));
    const cmd = getInput('command') as Commands;
    log.info(chalk.yellow('Executing:'), ` ${cmd}`);
    switch (cmd) {
      case Commands.BinaryBuilder:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await (await import('./commands/binary')).run();
        break;
      case Commands.DockerBuilder:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await (await import('./commands/docker/builder')).run();
        break;

      case Commands.DockerConfig:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await (await import('./commands/docker/config')).run();
        break;

      default:
        log.error(chalk.red('Unknown command:'), cmd);
        break;
    }
  } catch (error) {
    setFailed((error as Error).message);
  }
}
