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
      case Commands.DockerBuilder:
        await (await import('./commands/docker/builder')).run();
        break;

      case Commands.DockerConfig:
        await (await import('./commands/docker/config')).run();
        break;

      case Commands.DockerPublish:
        await (await import('./commands/docker/publish')).run();
        break;

      case Commands.GithubCleanup:
        await (await import('./commands/github/cleanup')).run();
        break;

      /* istanbul ignore next: obsolete */
      case Commands.PublishDocker:
        log.warn(`Obsolete, use '${Commands.DockerPublish}' command instead`);
        await (await import('./commands/docker/publish')).run();
        break;

      default:
        log.error(chalk.red('Unknown command:'), cmd);
        break;
    }
  } catch (error) {
    setFailed(error.message);
  }
}
