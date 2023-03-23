import * as _utils from '../../src/util';
import { createChecksum } from '../../src/utils/sum';
import type { BinaryBuilderConfig } from '../../src/utils/types';
import { mocked, partial } from '../utils';

jest.mock('../../src/util');

const utils = mocked(_utils);

describe('utils/sum', () => {
  it('works', async () => {
    utils.getDistro.mockReturnValue('focal');
    utils.getArch.mockReturnValue('x86_64');
    utils.readBuffer.mockResolvedValueOnce(Buffer.from('test'));
    await expect(
      createChecksum(partial<BinaryBuilderConfig>({ image: 'php' }), '1.2.3')
    ).toResolve();

    expect(utils.readBuffer).toHaveBeenCalledOnceWith(
      '.cache/php-1.2.3-focal-x86_64.tar.xz'
    );

    expect(utils.writeFile).toHaveBeenCalledOnceWith(
      '.cache/php-1.2.3-focal-x86_64.tar.xz.sha512',
      'ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff'
    );
  });
});
