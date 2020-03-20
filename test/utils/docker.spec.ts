import { getName, partial, mocked } from '../utils';
import _got, { Response } from 'got';
import {
  getRemoteImageId,
  getAuthHeaders,
  getLocalImageId,
} from '../../src/utils/docker';
import * as _utils from '../../src/util';

jest.mock('fancy-log');
jest.mock('got');
jest.mock('../../src/util');

const got: jest.Mock<Promise<Response>> = _got as never;
const utils = mocked(_utils);
const res = { code: 0, stdout: '', stderr: '' };

const registry = 'https://index.docker.io';
const image = 'renovate/base';
const digest =
  'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a1';

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthHeaders', () => {
    const headers = {
      'www-authenticate':
        'Bearer realm="https://auth.docker.io/token",service="registry.docker.io",scope="repository:renovate/base:pull"',
    };
    it('works', async () => {
      got
        .mockResolvedValueOnce(
          partial<Response<unknown>>({
            headers,
          })
        )
        .mockResolvedValueOnce(
          partial<Response<unknown>>({
            // eslint-disable-next-line @typescript-eslint/camelcase
            body: { access_token: 'XXX' },
          })
        );
      expect(await getAuthHeaders(registry, image)).toEqual({
        authorization: 'Bearer XXX',
      });
    });
    it('fails with auth', async () => {
      got
        .mockResolvedValueOnce(
          partial<Response<unknown>>({
            headers,
          })
        )
        .mockResolvedValueOnce(
          partial<Response<unknown>>({
            body: {},
          })
        );
      await expect(getAuthHeaders(registry, image)).rejects.toThrow(
        'Failed to obtain docker registry token'
      );
    });

    it('fails with http error', async () => {
      got.mockRejectedValueOnce(new Error('404'));
      await expect(getAuthHeaders(registry, image)).rejects.toThrow(
        'Failed to obtain docker registry token'
      );
    });
  });

  describe('getRemoteImageId', () => {
    it('works', async () => {
      got
        .mockResolvedValueOnce(
          partial<Response<unknown>>({
            headers: {},
          })
        )
        .mockResolvedValueOnce(
          partial<Response<unknown>>({
            body: {
              config: {
                digest,
              },
            },
          })
        );
      expect(await getRemoteImageId(image)).toEqual(digest);
    });

    it('throws', async () => {
      got
        .mockResolvedValueOnce(
          partial<Response<unknown>>({
            headers: {},
          })
        )
        .mockRejectedValueOnce(new Error('404'));
      await expect(getRemoteImageId(image)).rejects.toThrow(
        'Could not find remote image id'
      );
    });
  });

  describe('getLocalImageId', () => {
    it('works', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
        stdout: `'${digest}'\n"`,
      });

      expect(await getLocalImageId(image)).toEqual(digest);
    });

    it('throws', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
        stdout: '',
      });

      await expect(getLocalImageId(image)).rejects.toThrow(
        'Could not find local image id'
      );
    });
  });
});
