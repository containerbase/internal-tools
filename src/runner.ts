import * as _runner from '@actions/core';
import chalk from 'chalk';
import log from 'fancy-log';
import { Commands } from './types';
// import * as github from '@actions/github';

export default async function run(): Promise<void> {
  try {
    log.info(chalk.blue('Renovate Docker Builder'));
    // `command` input defined in action metadata file
    const cmd = _runner.getInput('command') as Commands;
    log(chalk.yellow('Executing:'), ` ${cmd}`);
    switch (cmd) {
      case Commands.PublishDocker:
        await (await import('./publish-docker')).run();
        break;
      default:
        log.warn(chalk.red('Unknown command:'), cmd);
        break;
    }
    // // Get the JSON webhook payload for the event that triggered the workflow
    // const payload = JSON.stringify(github.context.payload, undefined, 2);
    // console.log(`The event payload: ${payload}`);
  } catch (error) {
    log.error('Error', error);
    _runner.setFailed(error.message);
  }
}
