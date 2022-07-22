import * as ds from '../../../src/utils/datasource';

describe('utils/datasource/index', () => {
  it('works', () => {
    expect(ds.register).not.toThrow();
  });
});
