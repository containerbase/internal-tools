import * as _utils from '../../src/util';
import { getBinaryName } from '../../src/utils/github';
import { BinaryBuilderConfig } from '../../src/utils/types';
import { getName, mocked, partial } from '../utils';

jest.mock('../../src/util');

const utils = mocked(_utils);

describe(getName(__filename), () => {
  it('works', () => {
    utils.getDistro.mockReturnValue('focal');
    utils.getArch.mockReturnValueOnce('x86_64');
    expect(
      getBinaryName(
        partial<BinaryBuilderConfig>({ image: 'php' }),
        '1.2.3'
      )
    ).toBe('php-1.2.3-focal-x86_64.tar.xz');
    expect(
      getBinaryName(
        partial<BinaryBuilderConfig>({ image: 'php' }),
        '1.2.3'
      )
    ).toBe('php-1.2.3-focal.tar.xz');
  });
});
