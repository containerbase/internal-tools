import * as ds from '../../../src/utils/datasource';
import { getName } from '../../utils';

describe(getName(__filename), () => {
  it('works', () => {
    ds.register();
  });
});
