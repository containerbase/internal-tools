import * as renovate from '../../src/utils/renovate';
import { getName } from '../utils';

jest.mock('renovate/dist/util/cache/global/file');

describe(getName(__filename), () => {
  it('works', () => {
    renovate.register();
  });
});
