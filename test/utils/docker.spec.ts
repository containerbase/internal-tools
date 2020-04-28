import { getName, partial, mocked } from '../utils';
import _got, { Response, HTTPError } from 'got';
import {
  getRemoteImageId,
  getAuthHeaders,
  getLocalImageId,
  DockerContentType,
  build,
  publish,
} from '../../src/utils/docker';
import * as _utils from '../../src/util';

jest.mock('../../src/util');

const got: jest.Mock<Promise<Response>> = _got as never;
const utils = mocked(_utils);
const res = { code: 0, stdout: '', stderr: '' };

const registry = 'https://index.docker.io';
const digest =
  'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a1';
const tag = 'latest';

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthHeaders', () => {
    const image = 'renovate/base';
    const headers = {
      'www-authenticate':
        'Bearer realm="https://auth.docker.io/token",service="registry.docker.io",scope="repository:renovate/base:pull"',
    };
    it('works', async () => {
      got
        .mockResolvedValueOnce(
          partial<Response>({
            headers,
          })
        )
        .mockResolvedValueOnce(
          partial<Response>({
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
          partial<Response>({
            headers,
          })
        )
        .mockResolvedValueOnce(
          partial<Response>({
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
    const image = 'renovate/base';
    it('works', async () => {
      got
        .mockResolvedValueOnce(
          partial<Response>({
            headers: {},
          })
        )
        .mockResolvedValueOnce(
          partial<Response>({
            body: {
              config: {
                digest,
              },
            },
            headers: { 'content-type': DockerContentType.ManifestV2 },
          })
        );
      expect(await getRemoteImageId(image)).toEqual(digest);
    });

    it('return <none> on 404', async () => {
      got
        .mockResolvedValueOnce(
          partial<Response>({
            headers: {},
          })
        )
        .mockRejectedValueOnce(
          Object.assign(new HTTPError(partial<Response>()), {
            response: { statusCode: 404 },
          })
        );
      expect(await getRemoteImageId(image)).toEqual('<none>');
    });

    it('throws', async () => {
      got
        .mockResolvedValueOnce(
          partial<Response>({
            headers: {},
          })
        )
        .mockRejectedValueOnce(new Error('500'));
      await expect(getRemoteImageId(image)).rejects.toThrow(
        'Could not find remote image id'
      );
    });

    it('throws unsupported', async () => {
      got
        .mockResolvedValueOnce(
          partial<Response>({
            headers: {},
          })
        )
        .mockResolvedValueOnce(
          partial<Response>({
            headers: { 'content-type': DockerContentType.ManifestV1 },
          })
        );
      await expect(getRemoteImageId(image)).rejects.toThrow(
        'Could not find remote image id'
      );
    });
  });

  describe('getLocalImageId', () => {
    const image = 'renovate/base';
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

  describe('build', () => {
    const image = 'base';
    const cache = 'docker-build-cache';
    it('works', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
      });

      await build({ image, buildArgs: [] });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });

    it('uses cache', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
      });

      await build({ image, cache });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });

    it('uses cache (dry-run)', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
      });

      await build({
        image,
        cache,
        cacheTags: ['dummy'],
        dryRun: true,
        buildArg: 'DUMMY_VERSION',
        buildArgs: ['IMAGE=slim'],
      });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });
  });

  describe('publish', () => {
    const image = 'base';
    beforeEach(() => {
      got
        .mockResolvedValueOnce(
          partial<Response>({
            headers: {},
          })
        )
        .mockResolvedValueOnce(
          partial<Response>({
            body: {
              config: {
                digest,
              },
            },
            headers: { 'content-type': DockerContentType.ManifestV2 },
          })
        );
    });
    it('works', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
        stdout:
          'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a2',
      });

      await publish({ image, tag });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });

    it('works (dry-run)', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
        stdout:
          'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a2',
      });

      await publish({ image, tag, dryRun: true });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });

    it('uptodate', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
        stdout: digest,
      });

      await publish({ image, tag });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });
  });
});
