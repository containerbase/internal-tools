import { styleText } from 'node:util';
import { error as _error, warning as _warn } from '@actions/core';
import stripAnsi from 'strip-ansi';

function write(prefix: string, ...args: unknown[]): void {
  console.log([`[${prefix}]`, ...args].join(' '));
}

function dir(obj: unknown): void {
  console.dir(obj);
}

function debug(msg: unknown, ...args: unknown[]): void {
  write(styleText('blue', 'DEBUG'), msg, ...args);
}

function info(msg: unknown, ...args: unknown[]): void {
  write(styleText('green', ' INFO'), msg, ...args);
}

function warn(msg: unknown, ...args: unknown[]): void {
  write(styleText('magenta', ' WARN'), msg, ...args);
  _warn(stripAnsi([msg, ...args].join(' ')));
}

function error(msg: unknown, ...args: unknown[]): void {
  write(styleText('red', 'ERROR'), msg, ...args);
  _error(stripAnsi([msg, ...args].join(' ')));
}

const log = (m: unknown, ...args: unknown[]): void => debug(m, ...args);

log.dir = (m: unknown): void => dir(m);
log.info = (m: unknown, ...args: unknown[]): void => info(m, ...args);
log.warn = (m: unknown, ...args: unknown[]): void => warn(m, ...args);
log.error = (m: unknown, ...args: unknown[]): void => error(m, ...args);

export default log;
