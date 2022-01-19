import { api } from '../../../src/utils/versioning/ubuntu';
import { getName } from '../../utils';

describe(getName(__filename), () => {
  it('isVersion', () => {
    expect(api.isVersion('bionic')).toBe(true);
    expect(api.isVersion('focal')).toBe(true);
    expect(api.isVersion('groovy')).toBe(false);
  });

  it('isStable', () => {
    expect(api.isStable('bionic')).toBe(true);
    expect(api.isStable('16.04')).toBe(true);
    expect(api.isStable('13.16.3')).toBe(false);
    expect(api.isStable('groovy')).toBe(false);
  });

  it('isCompatible', () => {
    expect(api.isCompatible('bionic', '18.04')).toBe(true);
    expect(api.isCompatible('bionic', '20.04')).toBe(true);
    expect(api.isCompatible('20.10', '20.04')).toBe(true);
  });

  it('sortVersions', () => {
    expect(api.sortVersions('bionic', '18.04')).toBe(0);
    expect(
      ['18.04', 'bionic', '20.04', '16.04'].sort((a, b) =>
        api.sortVersions(a, b)
      )
    ).toEqual(['16.04', '18.04', 'bionic', '20.04']);
  });
});
