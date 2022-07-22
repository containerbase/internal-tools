import * as renovate from '../../src/utils/renovate';

describe('utils/renovate', () => {
  it('works', () => {
    expect(renovate.register).not.toThrow();
  });
});
