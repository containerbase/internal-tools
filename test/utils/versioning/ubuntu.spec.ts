import { api } from '../../../src/utils/versioning/ubuntu';
import { getName } from '../../utils';

describe(getName(__filename), () => {
  it('isVersion', () => {
    expect(api.isVersion('bionic')).toEqual('bionic');
    expect(api.isVersion('focal')).toEqual('focal');
    expect(api.isVersion('groovy')).toBeNull();
  });
  it('isStable', () => {
    expect(api.isStable('bionic')).toEqual(true);
    expect(api.isStable('13.16.3')).toBeUndefined();
    expect(api.isStable('groovy')).toBeUndefined();
  });

  it('isCompatible', () => {
    expect(api.isCompatible('bionic', '18.04')).toEqual(true);
    expect(api.isCompatible('bionic', '20.04')).toEqual(true);
    expect(api.isCompatible('20.10', '20.04')).toEqual(false);
  });

  it('sortVersions', () => {
    expect(api.sortVersions('bionic', '18.04')).toEqual(0);
    expect(
      ['18.04', 'bionic', '20.04'].sort((a, b) => api.sortVersions(a, b))
    ).toEqual(['18.04', 'bionic', '20.04']);
  });
});
