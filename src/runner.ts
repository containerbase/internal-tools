import { styleText } from 'node:util';
import { getInput, setFailed } from '@actions/core';
import { Commands } from './types';
import log from './utils/logger';

export default async function run(): Promise<void> {
  try {
    log.info(styleText('blue', 'Renovate Docker Builder'));
    const cmd = getInput('command') as Commands;
    log.info(styleText('yellow', 'Executing:'), ` ${cmd}`);
    switch (cmd) {
      case Commands.BinaryBuilder:
        await (await import('./commands/binary')).run();
        break;
      case Commands.DockerBuilder:
        await (await import('./commands/docker/builder')).run();
        break;

      case Commands.DockerConfig:
        await (await import('./commands/docker/config')).run();
        break;

      default:
        log.error(styleText('red', 'Unknown command:'), cmd);
        break;
    }
  } catch (error) {
    setFailed((error as Error).message);
  }
}
