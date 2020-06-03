import { getEnv } from '../../src/utils/env';
import { getName } from '../utils';

jest.mock('../src/utils/logger');

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEnv', () => {
    it('works', () => {
      expect(getEnv('NOT_FOUND_ENV_VAR')).toBe('');
      expect(getEnv('PATH')).toBeDefined();
    });
  });
});
