import * as renovate from '../../src/utils/renovate';
import { getName } from '../utils';

describe(getName(__filename), () => {
  it('works', () => {
    renovate.register();
  });
});
