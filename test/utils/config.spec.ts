import * as _utils from '../../src/util';
import { getBinaryName } from '../../src/utils/config';
import type { BinaryBuilderConfig } from '../../src/utils/types';
import { mocked, partial } from '../utils';

jest.mock('../../src/util');

const utils = mocked(_utils);

describe('utils/config', () => {
  it('works', () => {
    utils.getDistro.mockReturnValue('focal');
    utils.getArch.mockReturnValueOnce('x86_64');
    expect(
      getBinaryName(partial<BinaryBuilderConfig>({ image: 'php' }), '1.2.3'),
    ).toBe('php-1.2.3-focal-x86_64.tar.xz');
    expect(
      getBinaryName(partial<BinaryBuilderConfig>({ image: 'php' }), '1.2.3'),
    ).toBe('php-1.2.3-focal.tar.xz');
    expect(
      getBinaryName(
        partial<BinaryBuilderConfig>({ image: 'php' }),
        '1.2.3',
        true,
      ),
    ).toBe('php-1.2.3-focal.tar.xz.sha512');
  });
});
