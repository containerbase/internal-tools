import * as nock from 'nock';
import * as _utils from '../../src/util';
import {
  DockerContentType,
  build,
  getAuthHeaders,
  getLocalImageId,
  getRemoteImageId,
  publish,
  splitImage,
} from '../../src/utils/docker';
import { ExecError } from '../../src/utils/types';
import { mocked } from '../utils';

jest.mock('delay', () => () => Promise.resolve());
jest.mock('../../src/util');

const utils = mocked(_utils);
const res = { code: 0, stdout: '', stderr: '' };

const imagePrefix = 'renovate';
const digest =
  'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a1';
const tag = 'latest';
const realm = 'https://auth.docker.io';
const registry = 'https://index.docker.io';

describe('utils/docker', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.abortPendingRequests();
  });

  describe('splitImage', () => {
    it('works', () => {
      expect(splitImage('renovatebot/base')).toEqual({
        registry: 'index.docker.io',
        repository: 'renovatebot/base',
      });
      expect(splitImage('ghcr.io/containerbase/base')).toEqual({
        registry: 'ghcr.io',
        repository: 'containerbase/base',
      });
    });
  });

  describe('getAuthHeaders', () => {
    const image = 'renovate/base';
    const headers = {
      'www-authenticate': `Bearer realm="${realm}/token",service="registry.docker.io",scope="repository:${image}:pull"`,
    };

    it('works', async () => {
      nock(registry).get('/v2/').reply(200, {}, headers);
      nock(realm)
        .get(`/token?service=registry.docker.io&scope=repository:${image}:pull`)
        .reply(200, { access_token: 'XXX' });
      expect(await getAuthHeaders(registry.slice(8), image)).toEqual({
        authorization: 'Bearer XXX',
      });

      expect(nock.isDone()).toBe(true);
    });

    it('fails with auth', async () => {
      nock(registry).get('/v2/').reply(200, {}, headers);
      nock(realm)
        .get(`/token?service=registry.docker.io&scope=repository:${image}:pull`)
        .reply(200, {});
      await expect(getAuthHeaders(registry.slice(8), image)).rejects.toThrow(
        'Failed to obtain docker registry token'
      );

      expect(nock.isDone()).toBe(true);
    });

    it('fails with http error', async () => {
      nock(registry).get('/v2/').reply(200, {}, headers);
      nock(realm)
        .get(`/token?service=registry.docker.io&scope=repository:${image}:pull`)
        .reply(418);
      await expect(getAuthHeaders(registry.slice(8), image)).rejects.toThrow(
        'Failed to obtain docker registry token'
      );

      expect(nock.isDone()).toBe(true);
    });

    it('fails with missing service', async () => {
      nock(registry)
        .get('/v2/')
        .reply(
          200,
          {},
          {
            'www-authenticate': `Bearer realm="${realm}/token",scope="repository:${image}:pull"`,
          }
        );
      await expect(getAuthHeaders(registry.slice(8), image)).rejects.toThrow(
        'Failed to obtain docker registry token'
      );

      expect(nock.isDone()).toBe(true);
    });
  });

  describe('getRemoteImageId', () => {
    const image = 'renovate/base';

    it('works', async () => {
      nock(registry)
        .get('/v2/')
        .reply(200, {})
        .get(`/v2/${image}/manifests/${tag}`)
        .reply(
          200,
          {
            config: {
              digest,
            },
          },
          { 'content-type': DockerContentType.ManifestV2 }
        );
      expect(await getRemoteImageId(registry.slice(8), image)).toEqual(digest);
      expect(nock.isDone()).toBe(true);
    });

    it('return <none> on 404', async () => {
      nock(registry)
        .get('/v2/')
        .reply(200)
        .get(`/v2/${image}/manifests/${tag}`)
        .reply(404);

      expect(await getRemoteImageId(registry.slice(8), image)).toBe('<none>');
      expect(nock.isDone()).toBe(true);
    });

    it('return <error> on manifest v1', async () => {
      nock(registry)
        .get('/v2/')
        .reply(200, {})
        .get(`/v2/${image}/manifests/${tag}`)
        .reply(200, {}, { 'content-type': DockerContentType.ManifestV1 });

      expect(await getRemoteImageId(registry.slice(8), image)).toBe('<error>');
      expect(nock.isDone()).toBe(true);
    });

    it('throws', async () => {
      nock(registry)
        .get('/v2/')
        .reply(200)
        .get(`/v2/${image}/manifests/${tag}`)
        .reply(418);
      await expect(getRemoteImageId(registry.slice(8), image)).rejects.toThrow(
        'Could not find remote image id'
      );
      expect(nock.isDone()).toBe(true);
    });

    it('throws unsupported', async () => {
      nock(registry)
        .get('/v2/')
        .reply(200, {})
        .get(`/v2/${image}/manifests/${tag}`)
        .reply(200, {}, { 'content-type': 'unsupported' });

      await expect(getRemoteImageId(registry.slice(8), image)).rejects.toThrow(
        'Could not find remote image id'
      );
      expect(nock.isDone()).toBe(true);
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

      await build({ imagePrefix, image, buildArgs: [] });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });

    it('uses cache', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
      });

      await build({ imagePrefix, image, cache });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });

    it('uses cache (dry-run)', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
      });

      await build({
        imagePrefix,
        image,
        cache,
        cacheTags: ['dummy'],
        dryRun: true,
        buildArgs: ['IMAGE=slim'],
      });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });

    it('retries', async () => {
      utils.exec.mockRejectedValueOnce(
        new ExecError(1, 'failed', 'unexpected status: 400 Bad Request', '')
      );
      utils.exec.mockResolvedValueOnce({
        ...res,
      });

      await build({ imagePrefix, image });
      expect(utils.exec.mock.calls).toMatchSnapshot();
    });

    it('throws', async () => {
      utils.exec.mockRejectedValueOnce(
        new ExecError(1, 'failed', 'unexpected status: 400 Bad Request', '')
      );
      utils.exec.mockRejectedValueOnce(new Error('failure'));

      await expect(build({ imagePrefix, image })).rejects.toThrow('failure');

      expect(utils.exec.mock.calls).toMatchSnapshot();
    });
  });

  describe('publish', () => {
    const image = 'base';

    beforeEach(() => {
      nock(registry)
        .get('/v2/')
        .reply(200, {})
        .get(`/v2/renovate/${image}/manifests/${tag}`)
        .reply(
          200,
          {
            config: {
              digest,
            },
          },
          { 'content-type': DockerContentType.ManifestV2 }
        );
    });

    it('works', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
        stdout:
          'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a2',
      });
      utils.exists.mockResolvedValueOnce(true);

      await publish({ imagePrefix, image, tag });
      expect(utils.exec.mock.calls).toMatchSnapshot();

      expect(nock.isDone()).toBe(true);
    });

    it('works (dry-run)', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
        stdout:
          'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a2',
      });

      await publish({ imagePrefix, image, tag, dryRun: true });
      expect(utils.exec.mock.calls).toMatchSnapshot();

      expect(nock.isDone()).toBe(true);
    });

    it('uptodate', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
        stdout: digest,
      });

      await publish({ imagePrefix, image, tag });
      expect(utils.exec.mock.calls).toMatchSnapshot();

      expect(nock.isDone()).toBe(true);
    });

    it('skips signing', async () => {
      utils.exec.mockResolvedValueOnce({
        ...res,
        stdout:
          'sha256:d694b03ba0df63ac9b27445e76657d4ed62898d721b997372aab150ee84e07a2',
      });
      utils.exists.mockResolvedValue(false);

      await publish({ imagePrefix, image, tag });
      expect(utils.exec.mock.calls).toMatchSnapshot();

      expect(nock.isDone()).toBe(true);
    });
  });
});
