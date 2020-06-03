import { existsSync } from 'fs';
import * as fs from '../../src/utils/fs';
import { getName } from '../utils';

jest.mock('../src/utils/logger');

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('readJson', () => {
    afterEach(() => {
      delete process.env.GITHUB_WORKSPACE;
    });
    it('works', async () => {
      process.env.GITHUB_WORKSPACE = process.cwd();
      expect(await fs.readJson('.prettierrc.json')).toEqual({
        singleQuote: true,
        trailingComma: 'es5',
      });
    });
  });

  describe('readFile', () => {
    afterEach(() => {
      delete process.env.GITHUB_WORKSPACE;
    });
    it('works', async () => {
      process.env.GITHUB_WORKSPACE = process.cwd();
      expect(await fs.readFile('Dockerfile')).toMatchSnapshot();
    });
  });

  describe('resolveFile', () => {
    it('works', async () => {
      const file = await fs.resolveFile('bin/configure-docker.sh');
      expect(file).toBeDefined();
      expect(existsSync(file)).toBe(true);

      const file2 = await fs.resolveFile('bin/dummy.sh');
      expect(file2).toBeDefined();
      expect(existsSync(file2)).toBe(false);
    });
  });
});
