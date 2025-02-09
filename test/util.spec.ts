import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import * as _core from '@actions/core';
import * as _exec from '@actions/exec';
import * as _io from '@actions/io';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as util from '../src/util';
import { mocked } from './utils';

vi.mock('@actions/core');
vi.mock('@actions/exec');
vi.mock('@actions/io');
vi.mock('../src/utils/logger');
vi.mock('node:fs/promises', async (imp) => ({
  ...(await imp<typeof fs>()),
  writeFile: vi.fn(),
}));

const core = mocked(_core);
const exec = mocked(_exec);
const io = mocked(_io);

describe('util', () => {
  describe('exists', () => {
    it('returns true', async () => {
      io.which.mockResolvedValueOnce('');
      expect(await util.exists('test')).toBe(true);
    });

    it('returns false', async () => {
      io.which.mockRejectedValueOnce(new Error());
      expect(await util.exists('test')).toBe(false);
    });
  });

  describe('exec', () => {
    it('works', async () => {
      exec.exec.mockImplementationOnce((_cmd, _args, opts) => {
        if (opts?.listeners?.stdout) {
          opts.listeners.stdout(Buffer.from('test'));
        }
        if (opts?.listeners?.stderr) {
          opts.listeners.stderr(Buffer.from('testerr'));
        }
        return Promise.resolve(0);
      });
      expect(await util.exec('dummy-cmd', [])).toEqual({
        code: 0,
        stdout: 'test',
        stderr: 'testerr',
      });
    });

    it('throws', async () => {
      expect.assertions(1);
      exec.exec.mockResolvedValueOnce(1);
      await expect(util.exec('dummy-cmd', [])).rejects.toThrow();
    });
  });

  describe('isDryRun', () => {
    afterEach(() => {
      delete process.env.CI;
    });

    it('false', () => {
      process.env.CI = 'true';
      core.getInput.mockReturnValueOnce('false');
      expect(util.isDryRun()).toBe(false);
      expect(util.isDryRun()).toBe(false);
      expect(core.getInput).toHaveBeenCalledTimes(2);
    });

    it('true', () => {
      core.getInput.mockReturnValueOnce('true');
      expect(util.isDryRun()).toBe(true);
      expect(core.getInput).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEnv', () => {
    it('works', () => {
      expect(util.getEnv('NOT_FOUND_ENV_VAR')).toBe('');
      expect(util.getEnv('PATH')).toBeDefined();
    });
  });

  describe('getWorkspace', () => {
    let ws: string | undefined;

    beforeEach(() => {
      ws = process.env.GITHUB_WORKSPACE;
      delete process.env.GITHUB_WORKSPACE;
    });

    afterEach(() => {
      process.env.GITHUB_WORKSPACE = ws;
    });

    it('works', () => {
      expect(util.getWorkspace()).toBe(process.cwd());
      process.env.GITHUB_WORKSPACE = '/var/test';
      expect(util.getWorkspace()).toBe('/var/test');
    });
  });

  it('getDistro', () => {
    expect(util.getDistro()).toBe('');
  });

  it('getArch', () => {
    expect(util.getArch()).toBe('');
  });

  describe('readJson', () => {
    afterEach(() => {
      delete process.env.GITHUB_WORKSPACE;
    });

    it('works', async () => {
      process.env.GITHUB_WORKSPACE = process.cwd();
      expect(await util.readJson('.prettierrc.json')).toMatchObject({
        singleQuote: true,
        trailingComma: 'all',
      });
    });
  });

  describe('readFile', () => {
    afterEach(() => {
      delete process.env.GITHUB_WORKSPACE;
    });

    it('works', async () => {
      process.env.GITHUB_WORKSPACE = process.cwd();
      expect(await util.readFile('Dockerfile')).toMatchSnapshot();
    });
  });

  describe('writeFile', () => {
    afterEach(() => {
      delete process.env.GITHUB_WORKSPACE;
    });

    it('works', async () => {
      process.env.GITHUB_WORKSPACE = process.cwd();
      await expect(util.writeFile('Dockerfile', 'FROM alpine')).toResolve();
    });
  });

  describe('readBuffer', () => {
    afterEach(() => {
      delete process.env.GITHUB_WORKSPACE;
    });

    it('works', async () => {
      process.env.GITHUB_WORKSPACE = process.cwd();
      expect(
        (await util.readBuffer('Dockerfile')).toString(),
      ).toMatchSnapshot();
    });
  });

  describe('getArg', () => {
    it('single', () => {
      core.getInput.mockReturnValueOnce('test;latest;slim');
      expect(util.getArg('dockerfile')).toBe('test;latest;slim');
    });

    it('multi', () => {
      core.getInput.mockReturnValueOnce('test;latest;slim');
      expect(util.getArg('dockerfile', { multi: true })).toEqual([
        'test',
        'latest',
        'slim',
      ]);
    });

    it('multi (null)', () => {
      core.getInput.mockReturnValueOnce('');
      expect(util.getArg('dockerfile', { multi: true })).toEqual([]);
    });
  });

  describe('resolveFile', () => {
    it('works', async () => {
      const file = await util.resolveFile('package.json');
      expect(file).toBeDefined();
      expect(existsSync(file)).toBe(true);

      const file2 = await util.resolveFile('bin/dummy.sh');
      expect(file2).toBeDefined();
      expect(existsSync(file2)).toBe(false);
    });
  });
});
