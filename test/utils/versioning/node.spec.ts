import { api } from '../../../src/utils/versioning/node';
import { getName } from '../../utils';

describe(getName(__filename), () => {
  it('isStable(true)', () => {
    expect(api.isStable('12.16.3')).toEqual(true);
  });

  it('isStable(false)', () => {
    expect(api.isStable('13.16.3')).toEqual(false);
    expect(api.isStable('12.16.3-beta')).toEqual(false);
  });
});
